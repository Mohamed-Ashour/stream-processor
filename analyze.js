const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const analyzeLocations = (locationsData) => {
    const results = {
        bestTippers: { average: 0 },
        stingiestTippers: { average: Number.MAX_SAFE_INTEGER },
        mostProfitable: { average: 0 },
    };
    for (const location in locationsData) {
        const averageTip = locationsData[location].tips / locationsData[location].trips;
        if(averageTip > results.bestTippers.average) {
            results.bestTippers.average = averageTip;
            results.bestTippers.location = location;
        }

        if(averageTip < results.stingiestTippers.average) {
            results.stingiestTippers.average = averageTip;
            results.stingiestTippers.location = location;
        }

        const averageRate = locationsData[location].rate / locationsData[location].trips;
        if (averageRate > results.mostProfitable.average) {
            results.mostProfitable.average = averageRate;
            results.mostProfitable.location = location;
        }
    }

    return results;
};

const analyzeRoutes = (routesData) => {
    const congestionRoutes = [];

    for (const route in routesData) {
        const averageDuration = routesData[route].totalDuration / routesData[route].trips;
        const durationGap = routesData[route].maxDuration - routesData[route].minDuration;
        const congestion = durationGap / averageDuration;
        congestionRoutes.push({route, congestion});
    }

    const results = congestionRoutes.sort((a, b) => b.congestion - a.congestion);
    return results.slice(0, 5).map(result => result.route);
};

const analyzeOneOccupant = (oneOccupantData) => {
    const dailyMissedRideShares = {};
    for (const day in oneOccupantData) {
        let dayMissedRideShares = 0;
        for (const hour in oneOccupantData[day]) {
            for (const route in oneOccupantData[day][hour]) {
                if (oneOccupantData[day][hour][route] > 1) {
                    dayMissedRideShares += oneOccupantData[day][hour][route] - 1;
                }
            }
        }

        if (dayMissedRideShares > 0) {
            dailyMissedRideShares[day] = dailyMissedRideShares[day] || 0;
            dailyMissedRideShares[day] += dayMissedRideShares;
        }
    }

    return dailyMissedRideShares
};

const displayResults = (locationsResults, congestionRoutes, dailyMissedRideShares, zonesMap) => {
    console.clear();
    console.log('==========================================================================');
    console.log(`Best tippers are located in ${zonesMap[locationsResults.bestTippers.location]}`);
    console.log(`Stingiest tippers are located in ${zonesMap[locationsResults.stingiestTippers.location]}`);
    console.log('--------------------------------------------------------------------------');
    console.log(`Most profitable location for taxi to loiter is ${zonesMap[locationsResults.mostProfitable.location]}`);
    console.log('--------------------------------------------------------------------------');
    console.log('Routes that have a high chance to suffer traffic congestion at any moment:');
    for (const route of congestionRoutes) {
        const fromLocation = route.split('-')[0]
        const toLocation = route.split('-')[1]
        console.log(`   ${zonesMap[fromLocation]} => ${zonesMap[toLocation]}`)
    }
    console.log('--------------------------------------------------------------------------');
    console.log('There were missed ride share opportunities in the following days:');
    for (const day in dailyMissedRideShares) {
        console.log(`   ${WEEK_DAYS[day]}: ${dailyMissedRideShares[day]}`)
    }
    console.log('==========================================================================');
};

module.exports = ({locationsData, routesData, oneOccupantData, zonesMap}) => {
    const locationsResults = analyzeLocations(locationsData);
    const congestionRoutes = analyzeRoutes(routesData);
    const dailyMissedRideShares = analyzeOneOccupant(oneOccupantData);
    displayResults(locationsResults, congestionRoutes, dailyMissedRideShares, zonesMap);
};
