const request = require('request');
const Papa = require('papaparse');

const analyze = require('./analyze');


const filesDates = ['2020-01', '2020-02', '2020-03', '2020-04', '2020-05', '2020-06'];
const locationsData = {};
const routesData = {};
const oneOccupantData = {};
const zonesMap = {};

const onData = (record) => {
    const fare = record[10];
    const puDatetime = new Date(record[1]);
    const doDatetime = new Date(record[2]);
    const duration = doDatetime - puDatetime;

    // ignore invalid data
    if(!Number.isInteger(duration) || duration < 60000 || fare <= 0) return;

    const tip = Number(record[13]);
    const puLocation = record[7];
    const doLocation = record[8];
    const passengers = record[3];

    // aggregate locations data
    locationsData[puLocation] = locationsData[puLocation] || { trips: 0, tips: 0, rate: 0 };
    locationsData[puLocation].trips++;
    locationsData[puLocation].tips += tip;
    locationsData[puLocation].rate +=  fare / duration;

    // aggregate routes data
    const route = `${puLocation}-${doLocation}`;
    routesData[route] = routesData[route] || { totalDuration: 0, minDuration: Number.MAX_SAFE_INTEGER, maxDuration: 0, trips:0 };
    routesData[route].trips++;
    routesData[route].totalDuration +=  duration;

    if (duration > routesData[route].maxDuration) routesData[route].maxDuration = duration;

    if (duration < routesData[route].minDuration) routesData[route].minDuration = duration;

    // aggregate one occupant data
    if (passengers == 1) {
        const puHour = puDatetime.getHours();
        const puDate = puDatetime.getDay();
        oneOccupantData[puDate] = oneOccupantData[puDate] || {};
        oneOccupantData[puDate][puHour] = oneOccupantData[puDate][puHour] || {};
        oneOccupantData[puDate][puHour][route] = oneOccupantData[puDate][puHour][route] || 0;
        oneOccupantData[puDate][puHour][route]++;
    }
};

const start = function (index = 0) {
    const tripDataReadableStream = request(`https://s3.amazonaws.com/nyc-tlc/trip+data/yellow_tripdata_${filesDates[index]}.csv`);
    const csvParseStream = tripDataReadableStream.pipe(Papa.parse(Papa.NODE_STREAM_INPUT));
    csvParseStream.on('data', onData)
    csvParseStream.on('end', () => {
        if (filesDates[index+1]) {
            start(index+1);
        }
    })
};


const zoneLookupReadableStream = request('https://s3.amazonaws.com/nyc-tlc/misc/taxi+_zone_lookup.csv');
const zoneLookupParseStream = zoneLookupReadableStream.pipe(Papa.parse(Papa.NODE_STREAM_INPUT, {header: true}));
zoneLookupParseStream.on('data', (record) => {
    zonesMap[record.LocationID] = record.Zone;
});
zoneLookupParseStream.on('end', () => {
    start();
});

setInterval(() => {
    analyze({locationsData, routesData, oneOccupantData, zonesMap});
}, 1000);
