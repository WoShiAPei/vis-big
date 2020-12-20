


(function(w, d3, undefined){
    "use strict";


    var width, height;
    function getSize(){
        width = 1980,
            height = 1080;

        if(width === 0 || height === 0){
            setTimeout(function(){
                getSize();
            }, 100);
        }
        else {
            init();
        }
    }

    function calcPoint(d,id){
        var know = "number";
        var now;
        if(d.length>=2){
            var k = d[id];
            if(typeof(k) === know){
                now = [k,1];
                return now;
            }
        }
        var ans = 0,cnt = 0;
        var len = d.length;
        for(var i = 0;i<len;i++){
            var temp = calcPoint(d[i],id);
            ans+=temp[0];
            cnt+=temp[1];
        }
        now = [ans,cnt];
        return now;
    }

    function init(){
        var tooltip = d3.select("body")
            .append("div")
            .attr("class","tooltip")
            .style("opacity",1.0);



        //Setup path for outerspace
        var space = d3.geo.azimuthal()
            .mode("equidistant")
            .translate([width / 2, height / 2]);

        var scale = space.scale()+150;




        var spacePath = d3.geo.path()
            .projection(space)
            .pointRadius(1);

        //Setup path for globe
        var projection = d3.geo.azimuthal()
            .mode("orthographic")
            .translate([width / 2, height / 2]);

        var scale0 = projection.scale();



        var path = d3.geo.path()
            .projection(projection)
            .pointRadius(2);

        //Setup zoom behavior
        var zoom = d3.behavior.zoom(true)
            .translate(projection.origin())
            .scale(projection.scale())
            .scaleExtent([100, 800])
            .on("zoom", move);

        var circle = d3.geo.greatCircle();

        var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .call(zoom);

        //Create a list of random stars and add them to outerspace
        var starList = createStars(300);

        var stars = svg.append("g")
            .selectAll("g")
            .data(starList)
            .enter()
            .append("path")
            .attr("class", "star")
            .attr("d", function(d){
                spacePath.pointRadius(d.properties.radius);
                return spacePath(d);
            });


        svg.append("rect")
            .attr("class", "frame")
            .attr("width", width)
            .attr("height", height);

        //Create the base globe
        var backgroundCircle = svg.append("circle")
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('r', projection.scale())
            .attr('class', 'globe')
            .attr("filter", "url(#glow)")
            .attr("fill", "url(#gradBlue)");


        projection.scale(scale);
        space.scale(scale * 3);
        backgroundCircle.attr('r', scale);
        path.pointRadius(2 * scale / scale0);



        var g = svg.append("g"),
            features;
        var d = svg.append("d"),test;
        var tempStore,mainData;

        var texts = g.attr("id","texts");

        var node = g.attr("id1","circles");

        var arrStore = [];
        var countryIndex = [];
        var countryIndexLen = [];
        var countryCount = 0;
        var mapCountry = [];
        var mainLen;

        //Add all of the countries to the globe
        d3.json("world-countries.json", function(collection) {
            features = g.selectAll(".feature").data(collection.features);
            features.enter().append("path")
                .attr("class", "star")
                .on("mouseover",click)
                .on("mouseout",click1)
                .attr("d", function(d){return path(circle.clip(d)); });

            mainData = collection.features;
            mainLen = mainData.length-1
            for(var num = 0;num<=mainLen;num++){
                var meVal = collection.features[num].geometry.coordinates
                var tempx = calcPoint(meVal,0),tempy = calcPoint(meVal,1);
                var x = tempx[0]/tempx[1],y = tempy[0]/tempy[1];
                var now = [x,y];
                arrStore[num] = now;
            }





            texts.selectAll("text")
                .data(collection.features)
                .enter()
                .append("svg:text")
                .text(function (d){return d.properties.name})
                .attr("x", function(d){
                    return projection(d.geometry.coordinates[0][0])[0];
                })
                .attr("y", function(d){
                    return projection(d.geometry.coordinates[0][0])[1];
                })
                .attr("fill","#000000")
                .attr("opacity",0.0)
                .attr("font-size","9px");


            node.selectAll("circle")
                .data(collection.features)
                .enter()
                .append("svg:circle")
                .attr("r", 0)
                .style("fill", "red")
                .attr("opacity",0.8)
                .attr("cx", function(d){
                    return projection(d.geometry.coordinates[0][0])[0];
                })
                .attr("cy", function(d){
                    return projection(d.geometry.coordinates[0][0])[1];
                });


        });

        d3.json("new_json.json", function(collection) {
            test = d.selectAll(".data").data(collection.ret);
            tempStore = collection.data;
        });

        var testStore,len;

        d3.json("countrydata.json", function(collection) {
            testStore = collection.RECORDS;
            len = testStore.length;
            countryIndex[countryCount++] = 0;
            for(var i = 1;i<len-1;i++){
                if(testStore[i].countryFullName!==testStore[i+1].countryFullName){
                    countryIndexLen[countryCount-1] = i- countryIndex[countryCount-1];
                    countryIndex[countryCount++] = i+1;
                }
            }
            countryIndexLen[countryCount-1] = len - 1 - countryIndex[countryCount - 1];


            for(var i = 0;i<mainLen+1;i++){
                mapCountry[i] = -1;
                var mainName = mainData[i].properties.name;
                for(var j = 0;j<countryCount;j++){
                    var subName = testStore[countryIndex[j]].countryFullName;
                    if(subName === mainName){
                        // console.log(subName,mainName,i,j);
                        mapCountry[i] = j;
                        break;
                    }
                }

            }

            // var key = document.getElementById("key");
            // key.onkeydown = f;
            redraw();


        });

        function f(e){
            var e = e|| window.event;
            var s = e.type + " " + e.keyCode;
            console.log(e,s);
        }

        var timeFlag = 0;
        var timeCnt = 0;
        var month = 1;
        var day = 22;

        //Redraw all items with new projections
        function redraw(){


            features.attr("d", function(d){
                return path(circle.clip(d));
            });

            stars.attr("d", function(d){
                spacePath.pointRadius(d.properties.radius);
                return spacePath(d);
            });

            for(var num = mainLen+1;num<=(mainLen+1)*2-1;num++){
                var subNow = mainLen+1;
                //console.log(node[0][0].children[num+211]);
                var jd = texts[0][0].children[num-subNow].getAttributeNode("d");
                var circletext = texts[0][0].children[num];
                circletext.getAttributeNode("opacity").value = 0.0;
                if(jd != null){
                    var now = arrStore[num-subNow];
                    circletext.getAttributeNode("x").value = projection(now)[0];
                    circletext.getAttributeNode("y").value = projection(now)[1];
                    circletext.getAttributeNode("opacity").value = 1.0;
                }
            }

        }



        function click(d){
            d3.select(this).attr("class", "feature");



            // var nowname = d.properties.name;
            // for(var num = 211;num<=421;num++){
            //     var tempText = texts[0][0].children[num];
            //     if (tempText.innerHTML == nowname){
            //         var meVal = d.geometry.coordinates;
            //         console.log(meVal,num,d);
            //         var tempx = calcPoint(meVal,0),tempy = calcPoint(meVal,1);
            //         var x = tempx[0]/tempx[1],y = tempy[0]/tempy[1];
            //         var now = arrStore[num-210];
            //         var k = [x,y];
            //
            //
            //         tempText.getAttributeNode("x").value = projection(now)[0];
            //         tempText.getAttributeNode("y").value = projection(now)[1];
            //
            //         tempText.getAttributeNode("opacity").value = 1.0;
            //     }
            // }

        }

        function click1(d){
            d3.select(this).attr("class", "star");
        }

        var timeId = 0;
        var temp = 0;
        function move() {
            if(d3.event){
                var scale = d3.event.scale+150;
                var origin = [d3.event.translate[0] * -1, d3.event.translate[1]];

                projection.scale(scale);
                space.scale(scale * 3);
                backgroundCircle.attr('r', scale);
                path.pointRadius(2 * scale / scale0);

                projection.origin(origin);
                circle.origin(origin);

                //globe and stars spin in the opposite direction because of the projection mode
                var spaceOrigin = [origin[0] * -1, origin[1] * -1];
                redraw();
            }

        }

        function inFireDraw(){

            var origin = [temp,0];
            var spaceOrigin = [origin[0] * -1, origin[1] * -1];

            projection.scale(scale);
            space.scale(scale * 3);
            backgroundCircle.attr('r', scale);
            path.pointRadius(2 * scale / scale0);

            projection.origin(origin);
            circle.origin(origin);

            space.origin(spaceOrigin);
            redraw();

            temp +=0.35;
            timeFlag++;
            if(timeFlag%4===0){
                timeCnt++;
                day++;
                if(month===12&&day===18){
                    day--;
                }
                if(day>30){
                    month++;
                    day = 0;
                }
            }
            // console.log(temp,timeFlag,timeCnt);
            timeId = requestAnimationFrame(inFireDraw);
        }


        function createStars(number){
            var data = [];
            for(var i = 0; i < number; i++){
                data.push({
                    geometry: {
                        type: 'Point',
                        coordinates: randomLonLat()
                    },
                    type: 'Feature',
                    properties: {
                        radius: Math.random() * 1.5
                    }
                });
            }
            return data;
        }

        function randomLonLat(){
            return [Math.random() * 360 - 180, Math.random() * 180 - 90];
        }
    }

    getSize();

}(window, d3));