require 'open-uri'
require 'rubygems'
require 'nokogiri'

list_of_dalian_rent = Nokogiri::HTML(open('http://rent.dl.soufun.com/'))

rent_price = list_of_dalian_rent.xpath("//dd/strong")[1].content

puts rent_price
