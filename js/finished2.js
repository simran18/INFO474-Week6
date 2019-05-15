'use strict';
/*
1. make a filterByYear function

*/

(function () {

  let data = "no data";
  let allLocationData = "no data";
  let allYearsData = "no data";
  let svgScatterPlot = ""; // keep SVG reference in global scope
  let svgLineGraph = "";
  let countrySelected = "AUS";

  // load data and make scatter plot after window loads
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
        allLocationData = csvData
        allYearsData = csvData;
        basicPlot();
      });
  }

  // make scatter plot with trend line
  function basicPlot() {
    // get arrays of fertility rate data and life Expectancy data
    let pop_data = data.map((row) => parseFloat(row["pop_mlns"]));
    let year_data = data.map((row) => parseFloat(row["time"]));

    // find data limits
    let axesLimits = findMinMax(year_data, pop_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits,  "time", "pop_mlns", svgLineGraph, 
                                { min: 50, max: 450 }, { min: 50, max: 450 });
   console.log(mapFunctions.xScale);
    // draw title and axes labels
    makeLabels();
    dropDownCountry(mapFunctions);
  }

  function dropDownCountry(mapFunctions) {
    let dropdown = d3.select("body").append("select")
      .attr("name", "countries");

    let country_data = allYearsData.map((row) => parseFloat(row["location"])).filter(distinct);

    let options = dropdown.selectAll("option")
      .data(country_data)
      .enter()
      .append("option");
    options.text(function (d) { return d; })
      .attr("value", function (d) { return d; });

    makeLineGraph(mapFunctions, countrySelected);

    dropdown.on("change", function () {
      countrySelected = this.value;
      svgContainer.selectAll("path").remove();
      makeLineGraph(mapFunctions, countrySelected);
    });
  }

  function makeLineGraph(funcs, country) {
    filterByCountry(country);
    // get arrays of fertility rate data and life Expectancy data
    plotLineGraph(funcs);
  }

  function filterByCountry(country) {
    data = allLocationData.filter((row) => row['location'] == country);
  }

  function distinct(value, index, self) {
    return self.indexOf(value) === index;
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

  function plotLineGraph(funcs) {
    let line = d3.line()
      .x((d) => (funcs.x(d)))
      .y((d) => (funcs.y(d)));
    let pop_data_filtered = data.map((row) => parseFloat(row["pop_mlns"]));
    // make tooltip
    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
    svgLineGraph.append('path')
      .datum(pop_data_filtered)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      // add tooltip functionality to path
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html(d.time + "<br/>" + numberWithCommas(d["pop_mlns"] * 1000000))
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
        makeScatterPlot(d["time"]);
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });
  }

  // make scatter plot with trend line
  function makeScatterPlot(year) {
    filterByYear(year);
    svgScatterPlot.html("");
    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimitsScatter = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctionsScatter = drawAxes(axesLimitsScatter, "fertility_rate", "life_expectancy", svgScatterPlot,
      { min: 50, max: 450 }, { min: 50, max: 450 });

    // plot data as points and add tooltip functionality
    plotData(mapFunctionsScatter);
  }

  function plotData(funcs) {
    // get population data as array
    let pop_data = data.map((row) => +row["pop_mlns"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // append data to SVG and plot as points
    svgScatterPlot.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', (d) => pop_map_func(d["pop_mlns"]))
      .attr('fill', "#4286f4")

    svgScatterPlot.append('text')
      .attr('x', 230)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgScatterPlot.append('text')
      .attr('x', 230)
      .attr('y', 30)
      .style('font-size', '14pt')
      .text("Countries by Life Expectancy and Fertility Rate (" + data[0]["time"] + ")");

    svgScatterPlot.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');

  }


  function filterByYear(year) {
    data = allYearsData.filter((row) => row['time'] == year);
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY) {
    // return x value from a row of data
    let xValue = function (d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 10, limits.xMax]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale).tickFormat(d3.format("d"));
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) { return +d[y] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin]) // give domain buffer
      .range([rangeY.min, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
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
