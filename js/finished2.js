'use strict';
/*
1. make a filterByYear function

*/
(function () {

  let data = "no data";
  let data_country = "no data";
  //let allYearsData = "no data";
  let svgScatterPlot = ""; // keep SVG reference in global scope
  let svgLineGraph = "";
  let countrySelected = "AUS";

  // load data and make line graph after window loads
  window.onload = function () {
    svgLineGraph = d3.select("body")
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);

    svgScatterPlot = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData
        basicPlot(data);
      });
  }

  function basicPlot(csvData) {
    data_country = csvData;

    let country_data = data_country.map((d) => d.location).filter(distinct);

    makeLabels();
    dropDownCountry(country_data)
  }

  function distinct(value, index, self) {
    return self.indexOf(value) === index;
  }

  function dropDownCountry(countries) {
    let dropdown = d3.select("body")
      .append('text')
      .style('font-size', '8pt')
      .text("Select Countries ")
      .append("select")
      .attr("name", "years")

    let options = dropdown.selectAll("option")
      .data(countries)
      .enter()
      .append("option");

    options.text(function (d) { return d; })
      .attr("value", function (d) { return d; });

    plotLineGraph(countrySelected);

    dropdown.on("change", function () {
      countrySelected = this.value;
      svgLineGraph.selectAll("g").remove();
      svgLineGraph.selectAll(".graph-line").remove();
      svgLineGraph.selectAll("circle").remove();
      svgScatterPlot.html("");
      plotLineGraph(countrySelected);
    });

  }

  function plotLineGraph(country) {

    let data_filtered = data.filter((row) => row['location'] == country);
    let pop_data_filter = data_filtered.map((row) => parseFloat(row["pop_mlns"]));
    let year_data_filter = data_filtered.map((row) => parseFloat(row["time"]));
    let country_data = data_filtered.map((d) => d.location).filter(distinct);


    // find data limits
    let axesLimits_filtered = findMinMax(year_data_filter, pop_data_filter);

    // draw axes and return scaling + mapping functions
    let mapFunctions_filtered = drawAxes(axesLimits_filtered, "time", "pop_mlns", svgLineGraph);

    let line = d3.line()
      .x((d) => (mapFunctions_filtered.x(d)))
      .y((d) => (mapFunctions_filtered.y(d)));

    // make tooltip
    let div = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    let svgToolTip = div.append("svg")
          .attr('width', 500)
          .attr('height', 500);

    svgLineGraph.append('path')
      .datum(data_filtered)
      .attr("fill", "none")
      .attr("class", "graph-line")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line)

    // mapping functions
    let xMap = mapFunctions_filtered.x;
    let yMap = mapFunctions_filtered.y;

    svgLineGraph.selectAll(".dot")
      .data(data_filtered)
      .enter()
      .append("circle")
      .attr("r", 2)
      .style("fill", "steelblue")
      .attr("cx", xMap)
      .attr("cy", yMap)
      .on("mouseover", (d) => {
        div.transition()
          .duration(300)
          .style("opacity", .9);
        div.style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
        makeScatterPlot(d.time, svgToolTip)
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });
  }

  function makeScatterPlot(year, secondSvg) {
    secondSvg.html("");
    svgScatterPlot.html("");
    let data_year = data.filter((row) => row['time'] == year);

    let fertility_rate_data = data_year.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data_year.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxesPlot(axesLimits, "fertility_rate", "life_expectancy", svgScatterPlot);

    // draw axes and return scaling + mapping functions
    let mapFunctions_div = drawAxesPlot(axesLimits, "fertility_rate", "life_expectancy", secondSvg);

    plotData(mapFunctions, data_year, year, svgScatterPlot);
    plotData(mapFunctions_div, data_year, year, secondSvg);
  }

  function drawAxesPlot(limits, x, y, svg) {
    // return x value from a row of data
    let xValue = function (d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) { return +d[y] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map, fData, year, svg) {
    // get population data as array
    let pop_data = fData.map((row) => +row["pop_mlns"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([5, 15]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // append data to SVG and plot as points
    svg.selectAll('.dot')
      .data(fData)
      .enter()
      .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', (d) => pop_map_func(d["pop_mlns"]))
      .attr('fill', "#4286f4");

    svg.append('text')
      .attr('x', 230)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertitlity Rates');

    svgScatterPlot.append('text')
      .attr('x', 50)
      .attr('y', 30)
      .data(fData)
      .style('font-size', '12pt')
      .text("Life Expectancy vs Fertility Rate for all countries in " + year);

    svg.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }



  // make title and axes labels
  function makeLabels() {
    svgLineGraph.append('text')
      .attr('x', 50)
      .attr('y', 30)
      .style('font-size', '14pt')
      .text("Population Size over the Years for " + data[0]["location"]);

    svgLineGraph.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Time (years)');

    svgLineGraph.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population Size (millions)');
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg) {
    // return x value from a row of data
    let xValue = function (d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 5, limits.xMax]) // give domain buffer room
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale).tickFormat(d3.format("d"));
    svg.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) { return +d[y] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }


})();