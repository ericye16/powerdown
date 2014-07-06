from bs4 import BeautifulSoup
import urllib2
import json


def get_temps(year,month,day):
	year=str(year)
	month=str(month)
	day=str(day)

	url = 'http://climate.weather.gc.ca/climateData/hourlydata_e.html?timeframe=1&Prov=ONT&StationID=48549&hlyRange=2009-12-10|2014-07-04&Year='+year+'&Month='+month+'&Day='+day#+'&cmdB1=Go#'
	#print (url)

	response = urllib2.urlopen(url)
	html = response.read()
	soup=BeautifulSoup(html)

	#print (soup.prettify())

	date_string=year+'-'+month+'-'+day
	temps=[]
	for table in soup.findAll("table"):
		for row in table.findAll("tr"):
			if len(row.findAll('td'))>1:
				if ":" in str(row.findAll('td')[0]):
					cell=row.findAll('td')[1]
					text=str(cell)		
					content=text[4:(len(text)-5)] 
					try:
						temp = float(content)
					except ValueError:
						temp=10					
						if temps:
							temp=temps[len(temps)-1]		
					temps.append(temp)
	return temps
month_lengths=[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
day_temps=dict()
year = 2012
for month in range(1,13):
	for day in range(1,month_lengths[month-1]+1):
		date_str=str(year)+'-'+str(month)+'-'+str(day)
		day_temps[date_str]=get_temps(year,month,day)
	print('.')
year = 2013
for month in range(1,13):
	for day in range(1,month_lengths[month-1]+1):
		date_str=str(year)+'-'+str(month)+'-'+str(day)
		day_temps[date_str]=get_temps(year,month,day)
	print('.')
year = 2014
for month in range(1,7):
	for day in range(1,month_lengths[month-1]+1):
		date_str=str(year)+'-'+str(month)+'-'+str(day)
		day_temps[date_str]=get_temps(year,month,day)
	print('.')
with open('toronto_weather_data.json', 'wb') as fp:
    json.dump(day_temps, fp)

