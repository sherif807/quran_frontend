#!/usr/bin/env ruby
# frozen_string_literal: true

# Releases the build created by this Codemagic run through App Store Connect's
# API.  It deliberately does not print credentials or a JWT.

require "base64"
require "json"
require "net/http"
require "openssl"
require "time"
require "uri"

APP_ID = ENV.fetch("APP_STORE_CONNECT_APP_ID")
GROUP_ID = ENV.fetch("APP_STORE_CONNECT_INTERNAL_GROUP_ID")
BUILD_NUMBER = ENV.fetch("QURANALIVE_BUILD_NUMBER")
ISSUER_ID = ENV.fetch("APP_STORE_CONNECT_ISSUER_ID")
KEY_ID = ENV.fetch("APP_STORE_CONNECT_KEY_IDENTIFIER")
PRIVATE_KEY = ENV.fetch("APP_STORE_CONNECT_PRIVATE_KEY")
API_ROOT = "https://api.appstoreconnect.apple.com/v1"
POLL_SECONDS = Integer(ENV.fetch("TESTFLIGHT_POLL_SECONDS", "30"))
MAX_POLLS = Integer(ENV.fetch("TESTFLIGHT_MAX_POLLS", "60"))

def b64url(value)
  Base64.urlsafe_encode64(value, padding: false)
end

def token
  header = b64url(JSON.generate(alg: "ES256", kid: KEY_ID, typ: "JWT"))
  payload = b64url(JSON.generate(iss: ISSUER_ID, iat: Time.now.to_i, exp: Time.now.to_i + 1_000, aud: "appstoreconnect-v1"))
  signing_input = "#{header}.#{payload}"
  der_signature = OpenSSL::PKey.read(PRIVATE_KEY).sign("SHA256", signing_input)
  integers = OpenSSL::ASN1.decode(der_signature).value
  signature = integers.map { |integer| [integer.value.to_s(16).rjust(64, "0")].pack("H*") }.join
  "#{signing_input}.#{b64url(signature)}"
end

def request(method, path, body: nil)
  uri = URI("#{API_ROOT}#{path}")
  req = Net::HTTP.const_get(method.capitalize).new(uri)
  req["Authorization"] = "Bearer #{token}"
  req["Content-Type"] = "application/json"
  req.body = JSON.generate(body) if body
  response = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |http| http.request(req) }
  parsed = response.body.to_s.empty? ? {} : JSON.parse(response.body)
  [response, parsed]
end

def fail_with_api(response, parsed, context)
  details = Array(parsed["errors"]).map { |error| error["detail"] || error["title"] }.compact.join("; ")
  abort("#{context} failed (HTTP #{response.code})#{details.empty? ? "" : ": #{details}"}")
end

def fetch_build
  query = URI.encode_www_form("filter[app]" => APP_ID, "filter[version]" => BUILD_NUMBER, "limit" => "10", "sort" => "-uploadedDate")
  response, parsed = request("get", "/builds?#{query}")
  fail_with_api(response, parsed, "List builds") unless response.is_a?(Net::HTTPSuccess)
  Array(parsed["data"]).find { |build| build.dig("attributes", "version") == BUILD_NUMBER }
end

def build_in_group?(build_id)
  response, parsed = request("get", "/builds/#{build_id}/betaGroups?limit=200")
  fail_with_api(response, parsed, "Read build beta groups") unless response.is_a?(Net::HTTPSuccess)
  Array(parsed["data"]).any? { |group| group["id"] == GROUP_ID }
end

def attach_group(build_id)
  return if build_in_group?(build_id)

  response, parsed = request("post", "/builds/#{build_id}/relationships/betaGroups", body: {
    data: [{ type: "betaGroups", id: GROUP_ID }]
  })
  return if response.is_a?(Net::HTTPSuccess) || response.code == "204"

  # A concurrent/retried release may already have completed the attachment.
  return if response.code == "409" && build_in_group?(build_id)

  fail_with_api(response, parsed, "Attach internal TestFlight group")
end

puts "Waiting for App Store Connect build #{BUILD_NUMBER} to finish processing."
build = nil
MAX_POLLS.times do |attempt|
  build = fetch_build
  unless build
    puts "Build #{BUILD_NUMBER} is not visible yet (check #{attempt + 1}/#{MAX_POLLS})."
    sleep POLL_SECONDS
    next
  end

  state = build.dig("attributes", "processingState")
  case state
  when "VALID"
    break
  when "FAILED", "INVALID"
    abort("App Store Connect rejected build #{BUILD_NUMBER} with processing state #{state}.")
  else
    puts "Build #{BUILD_NUMBER} is #{state || "still processing"} (check #{attempt + 1}/#{MAX_POLLS})."
    sleep POLL_SECONDS
  end
end

abort("Timed out waiting for App Store Connect build #{BUILD_NUMBER}.") unless build && build.dig("attributes", "processingState") == "VALID"

unless build.dig("attributes", "usesNonExemptEncryption") == false
  abort("Build #{BUILD_NUMBER} still needs export-compliance attention; ITSAppUsesNonExemptEncryption must be NO for this app.")
end

attach_group(build.fetch("id"))
abort("Internal TestFlight group was not attached to build #{BUILD_NUMBER}.") unless build_in_group?(build.fetch("id"))

puts "Verified: build #{BUILD_NUMBER} is valid and assigned to the internal TestFlight group."
