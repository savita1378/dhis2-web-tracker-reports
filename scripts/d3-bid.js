/**
 * Created by harsh on 8/2/16.
 */
$(document).ready(function () {

    d3.makeChart = function (data, height, _width) {
        var top_margin = height/15;
        var bottom_margin = height/10;
        var left_margin = _width/10;
        var right_margin = _width/5;
        var padding = top_margin/6;

        var h = height - top_margin - bottom_margin;
        var w = _width - left_margin - right_margin;
        var xAxisLabels = data.xAxisLabels;
        var legend_labels = data.legendLabels;
        var svg = d3.select("#chart")
            .append("svg")
            .attr("width", _width)
            .attr("height", height);

        var x = d3.scale.linear()
            .domain([0, parseInt(data.max) + top_margin])
            .range([0, h]);

        var yAxisScale = d3.scale.linear()
            .domain([0, parseInt(data.max) + top_margin])
            .range([h, 0]);

        var header = [];
        var rows = data.matrix.length;
        var columns = data.matrix[0].length;
        var gap = padding;
        var width = (w - columns * gap) / (rows * columns );
        var fill = ["green", "teal", "red", "blue", "orange"];
        var legend_box_width = width;
        var legend_box_height = width/2;

        var yAxis = d3.svg.axis();
        yAxis.orient("left");
        yAxis.scale(yAxisScale)
            .ticks(columns);
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + left_margin + "," + top_margin + ")")
            .call(yAxis);

        for (var k = 0; k < rows; k++) {
            svg.selectAll("rect")
                .data(data.matrix[k], function (d, i) {
                    return d + i + k + Math.random();
                })
                .enter()
                .append("rect")
                .attr("x", function (d, i) {
                    return (rows * width + gap) * i + width * k + left_margin;
                })
                .attr("y", function (d) {
                    return (h - x(d) +top_margin);
                })
                .attr("width", width)
                .attr("height", function (d) {
                    return x(d);
                })
                .attr("fill", fill[k]);

            svg.selectAll("text")
                .data(data.matrix[k], function (d, i) {
                    return d + i + k + Math.random();
                })
                .enter()
                .append("text")
                .attr("x", function (d, i) {
                    return (rows * width + gap) * i + width * k + width / 2 + left_margin;
                })
                .attr("y", function (d) {
                    return (h - x(d)) + top_margin - padding;
                })
                .text(function (d) {
                    return d;
                })
                .attr("text-anchor", "middle");
        }

        // X Axis labels
        svg.selectAll("text")
            .data(xAxisLabels, function (d, i) {
                return d+i;
            })
            .enter()
            .append("text")
            .attr("x", function (d, i) {
                return left_margin +(i*rows*width) +(width/2) +i*gap;
            })
            .attr("y", function (d) {
                return (height-bottom_margin/2);
            })
            .text(function (d) {
                return d;
            });

        var line = d3.svg.line();
            svg.append("line")
                .attr("x1", left_margin)     // x position of the first end of the line
                .attr("y1", h+top_margin)      // y position of the first end of the line
                .attr("x2", w+left_margin)     // x position of the second end of the line
                .attr("y2", h+top_margin)
                .attr("class", "axis line");

        for (var k = 0; k < rows; k++) {
            svg.append("rect")
                .attr("x",function(){
                    return _width-right_margin;
                })
                .attr("y",function(){
                    return legend_box_height + (legend_box_height+padding)*k;
                })
                .attr("width", legend_box_width)
                .attr("height", function (d) {
                    return legend_box_height;
                })
                .attr("fill", fill[k])

            svg.append("text")
                .attr("x",function(){
                    return _width-right_margin + legend_box_width+padding;
                })
                .attr("y",function(){
                    return legend_box_height + (legend_box_height+padding)*k + legend_box_width/2;
                })
                .text(legend_labels[k])

        }

        }
})
