function createChart(containerId, title, data, colors) {
    const statsBody = document.querySelector(`#${containerId}`);
    if (!statsBody) {
        console.error(`Chart container #${containerId} not found`);
        return;
    }

    const chartContainer = document.createElement("div");
    chartContainer.id = `${containerId}Chart`;
    chartContainer.style.width = "100%";
    chartContainer.style.height = "300px";

    statsBody.innerHTML = `<h6 class="mb-3 text-white text-center">${title}</h6>`;
    statsBody.appendChild(chartContainer);

    const root = am5.Root.new(`${containerId}Chart`);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: am5.percent(50)
    }));

    // Add "No data" message
    const noDataLabel = chart.children.unshift(am5.Label.new(root, {
        text: "No chart data available",
        fontSize: 14,
        fontWeight: "500",
        textAlign: "center",
        x: am5.percent(50),
        y: am5.percent(50),
        centerX: am5.percent(50),
        centerY: am5.percent(50),
        fill: am5.color("#6c757d")
    }));

    const series = chart.series.push(am5percent.PieSeries.new(root, {
        valueField: "count",
        categoryField: "category",
        alignLabels: false
    }));

    series.get("colors").set("colors", colors.map(color => am5.color(color)));

    series.labels.template.setAll({
        textType: "circular",
        centerX: 0,
        centerY: 0,
        fontSize: "12px",
        fontWeight: "500",
        fill: am5.color("#ffffff"),
        oversizedBehavior: "wrap"
    });

    series.slices.template.setAll({
        stroke: am5.color("#495057"),
        strokeWidth: 2,
        cornerRadius: 3,
        shadowOpacity: 0.1,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 5,
        shadowColor: am5.color("#000000"),
        toggleKey: "active"
    });

    series.slices.template.states.create("hover", {
        scale: 1.05,
        shadowOpacity: 0.3,
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        shadowBlur: 8
    });

    series.slices.template.states.create("active", {
        scale: 1.1,
        shiftRadius: 15
    });

    series.slices.template.set("cursorOverStyle", "pointer");
    series.slices.template.set("tooltipText", "{category}: {count} submissions ({valuePercentTotal.formatNumber('#.0')}%)");

    series.set("tooltip", am5.Tooltip.new(root, {
        getFillFromSprite: false,
        autoTextColor: false
    }));

    series.get("tooltip").get("background").setAll({
        fill: am5.color("#343a40"),
        stroke: am5.color("#6c757d"),
        strokeWidth: 1,
        cornerRadius: 4,
        fillOpacity: 0.95
    });

    series.get("tooltip").label.setAll({
        fill: am5.color("#ffffff"),
        fontSize: "11px",
        fontWeight: "500"
    });

    const legend = chart.children.push(am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
        marginTop: 10,
        marginBottom: 10
    }));

    legend.labels.template.setAll({
        fontSize: "12px",
        fontWeight: "500",
        fill: am5.color("#ffffff")
    });

    legend.valueLabels.template.setAll({
        fill: am5.color("#ffffff")
    });

    legend.markers.template.setAll({
        width: 14,
        height: 14
    });

    legend.data.setAll(series.dataItems);

    if (!data || data.length === 0) {
        chart.set("opacity", 0.3);
        series.set("visible", false);
        legend.set("visible", false);
        series.data.setAll([]);
    } else {
        noDataLabel.set("visible", false);
        chart.set("opacity", 1);
        series.set("visible", true);
        legend.set("visible", true);
        series.data.setAll(data);
        series.appear(1000, 100);
    }

    return chart;
}

function createRecordedFormatChart(stats, options) {
    if (!stats || !stats.recordFormat) {
        createChart("recordFormatDist", "Recorded Format", [], ["#4CAF50", "#F44336"]);
        return;
    }

    const chartData = Object.entries(stats.recordFormat).map(([format, count]) => ({
        category: format,
        count: count
    }));

    createChart(options.recordFormat.containerId, options.recordFormat.title, chartData, ["#4CAF50", "#F44336"]);
}

function createAuthorDistributionChart(stats, options) {
    if (!stats || !stats.isAuthor) {
        createChart("mapAuthorChart", "Map Author", [], ["#FF9800", "#2196F3"]);
        return;
    }

    const chartData = Object.entries(stats.isAuthor).map(([type, count]) => ({
        category: type,
        count: count
    }));

    createChart(options.isAuthor.containerId, options.isAuthor.title, chartData, ["#FF9800", "#2196F3"]);
}

function createSubmissionTypeChart(stats, options) {
    if (!stats || !stats.distributable) {
        createChart("submissionTypeChart", "Submission Distributable", [], ["#9C27B0", "#607D8B"]);
        return;
    }

    const chartData = Object.entries(stats.distributable).map(([type, count]) => ({
        category: type,
        count: count
    }));

    createChart(options.distributable.containerId, options.distributable.title, chartData, ["#9C27B0", "#607D8B"]);
}

async function createSubmissionCharts(roundId, options) {
    let stats;
    try {
        const result = await fetch(`${baseUrl}/stats/${roundId}`);
        stats = await result.json();
    } catch (e) {
        console.error(e.message);
        stats = {};
    }
    createRecordedFormatChart(stats, options);
    createAuthorDistributionChart(stats, options);
    createSubmissionTypeChart(stats, options);

}