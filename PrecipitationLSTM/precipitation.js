const actualMap = L.map('actual-map').setView([47.7511, -120.7401], 7);
const predictedMap = L.map('predicted-map').setView([47.7511, -120.7401], 7);

// OpenTopoMap tile layer
const topologicalTileLayer = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';

// Add topological tiles to the maps
L.tileLayer(topologicalTileLayer, { maxZoom: 17, attribution: '© OpenStreetMap contributors, © OpenTopoMap', opacity: 0.7}).addTo(actualMap);
L.tileLayer(topologicalTileLayer, { maxZoom: 17, attribution: '© OpenStreetMap contributors, © OpenTopoMap', opacity: 0.7}).addTo(predictedMap);

const getColorActual = (precipitation) => {
    return precipitation < 0.008 ? '#008000' : 
           precipitation < 0.025 ? '#0000ff' : '#ff0000';
};

const getColorPredicted = (precipitation) => {
    return precipitation < 0.05 ? '#008000' : 
           precipitation < 0.2 ? '#0000ff' : '#ff0000';
};

const createPoints = (data, map, getColorFunction) => {
    if (window[map._container.id + 'Layer']) {
        window[map._container.id + 'Layer'].remove();
    }
    window[map._container.id + 'Layer'] = L.layerGroup().addTo(map);
    data.forEach(d => {
        const color = getColorFunction(d.PRECIPITATION);
        const circle = L.circle([d.LAT, d.LON], { color, fillColor: color, fillOpacity: 0.7, radius: 5000 });

        const tooltipContent = `
            <strong>Coordinates:</strong> ${d.LAT}, ${d.LON}<br>
            <strong>Elevation:</strong> ${d.ELEVATION} m<br>
            <strong>Temperature:</strong> ${d.TEMP} °C<br>
            <strong>USAF Station:</strong> ${d.USAF}
        `;

        circle.bindTooltip(tooltipContent, { permanent: false, direction: "auto" });
        circle.addTo(window[map._container.id + 'Layer']);
    });
};

Promise.all([
    d3.csv('Original2019.csv'),
    d3.csv('Predicted2019.csv')
]).then(([actualData, predictedData]) => {
    actualData = processData(actualData, 'Original2019.csv');
    predictedData = processData(predictedData, 'Predicted2019.csv');

    document.getElementById('time-slider').addEventListener('input', function() {
        const sliderValue = parseInt(this.value);
        updateDisplay(sliderValue);
        createPoints(filterData(actualData, sliderValue), actualMap, getColorActual);
        createPoints(filterData(predictedData, sliderValue), predictedMap, getColorPredicted);
    });

    updateDisplay(0);
    createPoints(filterData(actualData, 0), actualMap, getColorActual);
    createPoints(filterData(predictedData, 0), predictedMap, getColorPredicted);
});

const processData = (data, filename) => {
    console.log(`Processing data from ${filename}`, data);
    return data.map(d => ({
        YEAR: +d.YEAR,
        MONTH: +d.MONTH,
        LAT: +d.LAT,
        LON: +d.LON,
        PRECIPITATION: +d.PRCP,
        ELEVATION: +d['ELEV(M)'],
        TEMP: +d.TEMP,
        USAF: d.USAF
    }));
};

const filterData = (data, sliderValue) => {
    const month = (sliderValue % 2) + 1;
    console.log(`Filtering data for month: ${month}`);
    return data.filter(d => d.YEAR === 2019 && d.MONTH === month);
};

const updateDisplay = (sliderValue) => {
    const monthNames = ["January", "February"];
    document.getElementById('date-display').textContent = `${monthNames[sliderValue]} 2019`;
};

const addLegend = (map) => {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'info legend');
        const categories = [
            { label: "Low Precipitation", color: '#008000' },
            { label: "Medium Precipitation", color: '#0000ff' },
            { label: "High Precipitation", color: '#ff0000' }
        ];

        categories.forEach(category => {
            div.innerHTML +=
                '<i style="background:' + category.color + '"></i> ' +
                '<span style="color:' + category.color + '">' + category.label + '</span><br>';
        });

        return div;
    };

    legend.addTo(map);
};

addLegend(actualMap);
addLegend(predictedMap);