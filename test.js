// country_data_src_name = "COVID-19-Data/json格式/countrydata.json"
country_data_src_name = "countrydata.json"

country_data = [];
code2country_data = {};
country_data_loaded = 0;
date2index = {};
svgs = {};
svg_id = 0;
bubble_chart_font_size = 20;
bubble_transform_func = d => Math.sqrt(d) * 0.5 + 15;
time_line = []

function load_country_data() {
    if (country_data_loaded != 0) return;
    country_data_loaded = -1;
    tl = [31,29,31,30,31,30,31,31,30,31,30,31]
    for (mi in tl) for (d=1;d<=tl[mi];d++)time_line.push(20200100+mi*100+d);
    tl = [31,28,31,30,31,30,31,31,30,31,30,31]
    for (mi in tl) for (d=1;d<=tl[mi];d++)time_line.push(20210100+mi*100+d);
    // console.log(time_line);
    d3.json(country_data_src_name, function(json) {
        country_data = json.RECORDS;
        for (var i = 0; i < country_data.length; i++) {
            sc = country_data[i]["countryShortCode"];
            if (!code2country_data.hasOwnProperty(sc)) {
                code2country_data[sc] = [];
            }
            code2country_data[sc].push(country_data[i]);
        }
        country_data_loaded = 1;
    });
    return;
}

function create_line_chart(country_short_codes, st_time, ed_time, data_type) {
    if (country_data_loaded != 1) return [false, -1];
    return [true, create_line_chart_2(country_short_codes, st_time, ed_time, data_type)];
}

function create_line_chart_2(country_short_codes, st_time, ed_time, data_type) {
    console.log(country_short_codes);
    width = 650;
    height = 400;
    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "svg" + svg_id);
    svgs[svg_id] = svg;
    svg_id++;

    datamin = 100000000;
    datamax = -100000000;
    padding = {left:100, right:90, top:20, bottom:20};
    datasets = {}
    xValue = []

    for (var codeid in country_short_codes) {
        code = country_short_codes[codeid];
        data = code2country_data[code];
        datasets[code] = [];
        for (var i = 0; i < data.length; i++) {
            if ((st_time) <= (data[i]["dateId"]) && (ed_time) >= (data[i]["dateId"])) {
                d = Number(data[i][data_type]);
                datasets[code].push(d);
                if (datamin > d) datamin = d;
                if (datamax < d) datamax = d;
                if (!xValue.includes(data[i]["dateId"])) xValue.push(data[i]["dateId"]);
            }
        }
    }
    xValueShrink = []
    xValueShrinkStep = parseInt(xValue.length / 12);
    for (var i = 0; i < xValue.length; i += xValueShrinkStep) {
        xValueShrink.push(xValue[i]);
    }
    xValueShrink.push(time_line[time_line.findIndex(d => d == xValueShrink[xValueShrink.length-1])+xValueShrinkStep]);

    xScale = d3.scale.ordinal().domain(d3.range(xValue.length))
        .rangeBands([0, width - padding.left - padding.right]);
    xScaleShrink = d3.scale.ordinal().domain(d3.range(xValueShrink.length))
        .rangeBands([0, (width - padding.left - padding.right) * (xValueShrink.length) * xValueShrinkStep / xValue.length]);
    yScale = d3.scale.linear().domain([datamin, datamax])
        .range([height - padding.top - padding.bottom, 0]);
    xAxis = d3.svg.axis().scale(xScaleShrink).orient("bottom")
        .tickFormat(d => String(xValueShrink[d]).slice(4,8));
    yAxis = d3.svg.axis().scale(yScale).orient("left");

    svg.append("g")
        .attr("class", "axis")
        .attr("id", "xAxis")
        .attr("transform", "translate(" + padding.left + "," + (height - padding.bottom) + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "axis")
        .attr("id", "yAxis")
        .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
        .call(yAxis);

    colorMap = d3.scale.category10().domain(country_short_codes);

    xAxisTS = svg.select("#xAxis").select("g").attr("transform");
    xAxisTransformValue = parseFloat(xAxisTS.slice(xAxisTS.indexOf("(")+1, xAxisTS.indexOf(",")))

    line = d3.svg.line()
        .x(d => xScale(d[0]) + padding.left + xAxisTransformValue + xScale.rangeBand() / 2)
        .y(d => yScale(d[1]) + padding.top);
    // window.alert(datasets["USA"]);
    for (codeid in datasets) {
        dataset = datasets[codeid];
        dataset2 = [];
        for (var i = 0; i < dataset.length; i++) {
            dataset2.push([i, dataset[i]]);
        }
        lines = svg.append("path").datum(dataset2)
            .attr("fill", "none")
            .attr("stroke", colorMap(codeid))
            .attr("stroke-width", 1.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", line);
    }

    paddingWithChart = 15 + xAxisTransformValue
    rectPadding = 5;
    font_size = 15;
    country_color_blocks = svg.selectAll(".rect").data(country_short_codes).enter().append("rect")
        .attr("x", function(d, i) {return width - padding.right + paddingWithChart;})
        .attr("y", function(d, i) {return i * (font_size + rectPadding) + padding.top;})
        .attr("width", font_size)
        .attr("height", font_size)
        .attr("fill", d => colorMap(d));

    console.log(country_color_blocks);
    texts = svg.selectAll(".rect").data(country_short_codes).enter().append("text")
        .attr("x", 150)
        .attr("y", 150)
        .attr("font-size", font_size)
        .text(d => d);

    return svg_id - 1;
}

function create_bubble_chart(country_short_codes, show_time, data_type) {
    if (country_data_loaded != 1) return [false, -1];
    return [true, create_bubble_chart_2(country_short_codes, show_time, data_type)];
}

function create_bubble_chart_2(country_short_codes, show_time, data_type) {
    width = 650;
    height = 650;
    datasets = [];
    for (var codeid in country_short_codes) {
        code = country_short_codes[codeid];
        found_time = false;
        for (var i in code2country_data[code]) {
            if (code2country_data[code][i]["dateId"] == show_time) {
                datasets.push({code:code, value:Number(code2country_data[code][i][data_type])});
            }
        }
    }

    color = d3.scale.category10().domain(country_short_codes);

    pack = data => d3.layout.pack()
        .size([width - 2, height - 2])
        .padding(10)
        .radius(bubble_transform_func)
        .nodes({children: data});
    
    nodes = pack(datasets);
    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "svg" + svg_id)
        .attr("text-anchor", "middle")
        .attr("font-size", 10);
    svgs[svg_id] = svg;
    svg_id++;
    sid = svg_id - 1;
    
    // console.log(nodes[0].children);
    nodes = nodes[0].children;
    svg.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("id", d => "svg" + sid + "-circle-" + d.code)
        .attr("fill", d => color(d.code))
        .attr("fill-opacity", 0.7)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.r);
    
    font_size = bubble_chart_font_size;
    svg.selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("id", d => "svg" + sid + "-text-" + d.code)
        .attr("x", d => d.x)
        .attr("y", d => d.y + font_size / 2)
        .attr("font-size", font_size)
        .attr("text-anchor", "middle")
        .text(d => d.code);

    return svg_id - 1;
}

function update_bubble_chart(sid, country_short_codes, show_time, data_type) {
    var svg = svgs[sid];
    datasets = [];
    for (var codeid in country_short_codes) {
        code = country_short_codes[codeid];
        found_time = false;
        for (var i in code2country_data[code]) {
            if (code2country_data[code][i]["dateId"] == show_time) {
                datasets.push({code:code, value:Number(code2country_data[code][i][data_type])});
            }
        }
    }
    width = 650;
    height = 400;

    pack = data => d3.layout.pack()
        .size([width - 2, height - 2])
        .padding(10)
        .radius(bubble_transform_func)
        .nodes({children: data});
    nodes = pack(datasets)[0].children;

    for (nid in nodes) {
        node = nodes[nid];
        // console.log("#svg" + sid + "-circle-" + node.code);
        font_size = bubble_chart_font_size;
        svg.select("#svg" + sid + "-circle-" + node.code)
            .transition()
            .duration(1000)
            .attr("cx", node.x)
            .attr("cy", node.y)
            .attr("r", node.r);
        svg.select("#svg" + sid + "-text-" + node.code)
            .transition()
            .duration(1000)
            .attr("x", node.x)
            .attr("y", node.y + font_size / 2);
    }
}

function create_stacked_bar_chart(country_short_code) {
    if (country_data_loaded != 1) return [false, -1];
    return [true, create_stacked_bar_chart2(country_short_code)];
}

function create_stacked_bar_chart2(country_short_code) {
    width = 650;
    height = 400;
    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "svg" + svg_id);
    svgs[svg_id] = svg;
    svg_id++;

    datamin = 100000000;
    datamax = -100000000;
    padding = {left:100, right:90, top:20, bottom:50};
    datasets = {};

    // confirmedCount = curedCount + currentConfirmedCount + deadCount
    dataset = []; // list[[int, int, int, int, int]]
    data = code2country_data[country_short_code];
    for (i in data) {
        d = data[i];
        dataset.push(
            [d["confirmedCount"], d["curedCount"], d["currentConfirmedCount"], d["deadCount"], d["dateId"]]
        );
    }

    xValueShrink = []
    xValueShrinkStep = parseInt(dataset.length / 12);
    for (var i = 0; i < dataset.length; i += xValueShrinkStep) {
        xValueShrink.push(dataset[i][4]); // push dateId
    }
    xValueShrink.push(time_line[time_line.findIndex(d => d == xValueShrink[xValueShrink.length-1])+xValueShrinkStep]);
    // console.log(xValueShrink.length, xValueShrinkStep, dataset.length)
    xScale = d3.scale.ordinal().domain(d3.range(dataset.length))
        .rangeBands([0, width - padding.left - padding.right]);
    xScaleShrink = d3.scale.ordinal().domain(d3.range(xValueShrink.length))
        .rangeBands([0, (width - padding.left - padding.right) * (xValueShrink.length) * xValueShrinkStep / dataset.length]);
    yScale = d3.scale.linear().domain([0, dataset[dataset.length - 1][0]])
        .range([height - padding.top - padding.bottom, 0]);
    xAxis = d3.svg.axis().scale(xScaleShrink).orient("bottom")
        .tickFormat(d => String(xValueShrink[d]).slice(4,8))
        .tickPadding(0);
    // console.log(xAxis.outerTickSize())
    yAxis = d3.svg.axis().scale(yScale).orient("left");

    svg.append("g")
        .attr("class", "axis")
        .attr("id", "xAxis")
        .attr("transform", "translate(" + padding.left + "," + (height - padding.bottom) + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "axis")
        .attr("id", "yAxis")
        .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
        .call(yAxis);
    
    colorMap = d3.scale.category10().domain([1, 2, 3]);

    xAxisTS = svg.select("#xAxis").select("g").attr("transform");
    xAxisTransformValue = parseFloat(xAxisTS.slice(xAxisTS.indexOf("(")+1, xAxisTS.indexOf(",")))

    var rects = svg.selectAll("rect").data(dataset).enter();
    rects.append("rect")
        .attr("transform", "translate(" + (padding.left + xAxisTransformValue) + "," + padding.top + ")")
        .attr("x", (d, i) => xScale(i))
        .attr("y", (d, i) => yScale(d[0]))
        .attr("width", xScale.rangeBand())
        .attr("height", d => yScale(d[0] - d[1]) - yScale(d[0]))
        .attr("fill", colorMap(1));
    rects.append("rect")
        .attr("transform", "translate(" + (padding.left + xAxisTransformValue) + "," + padding.top + ")")
        .attr("x", (d, i) => xScale(i))
        .attr("y", (d, i) => yScale(d[0] - d[1]))
        .attr("width", xScale.rangeBand())
        .attr("height", d => yScale(d[0] - d[1] - d[2]) - yScale(d[0] - d[1]))
        .attr("fill", colorMap(2));
    rects.append("rect")
        .attr("transform", "translate(" + (padding.left + xAxisTransformValue) + "," + padding.top + ")")
        .attr("x", (d, i) => xScale(i))
        .attr("y", (d, i) => yScale(d[0] - d[1] - d[2]))
        .attr("width", xScale.rangeBand())
        .attr("height", d => height - padding.top - padding.bottom - yScale(d[0] - d[1] - d[2]))
        .attr("fill", colorMap(3));
    
    font_size = 15;
    from_left = 150;
    type_color_blocks = svg.selectAll(".rect").data([1,2,3]).enter().append("rect")
        .attr("x", function(d, i) {return from_left + (width - padding.right - from_left) / 3 * i;})
        .attr("y", function(d, i) {return height - padding.bottom + 25;})
        .attr("width", font_size)
        .attr("height", font_size)
        .attr("fill", d => colorMap(d));
    texts = svg.selectAll(".rect").data(["cured","confirmed","dead"]).enter().append("text")
        .attr("x",function(d, i) {return from_left + (width - padding.right - from_left) / 3 * i + 20;})
        .attr("y", function(d, i) {return height - padding.bottom + 23 + font_size;})
        .attr("font-size", font_size)
        .text(d => d);
}

function remove_svg(sid) {
    // window.alert("removing svg" + sid);
    d3.select("body").select("#svg" + sid).remove();
}