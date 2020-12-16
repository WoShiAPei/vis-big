


(function(w, d3, undefined){
    "use strict";
    

    var width, height;
    function getSize(){
        width = w.innerWidth,
        height = w.innerHeight;

        if(width === 0 || height === 0){
            setTimeout(function(){
                getSize();
            }, 100);
        }
        else {
            init();
        }
    }

    function init(){
        var tooltip = d3.select("body")
            .append("div")
            .attr("class","tooltip")
            .style("opacity",0.0);




        //Setup path for outerspace
        var space = d3.geo.azimuthal()
            .mode("equidistant")
            .translate([width / 2, height / 2]);

        space.scale(space.scale() * 3);

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

  

        var g = svg.append("g"),
            features;
        var d = svg.append("d"),test;
        var tempStore;

        var texts = g.attr("id","texts");



        //Add all of the countries to the globe
        d3.json("world-countries.json", function(collection) {
            features = g.selectAll(".feature").data(collection.features);
            features.enter().append("path")
                .attr("class", "star")
                .on("mouseover",click)
                .on("mouseout",click1)
                .attr("d", function(d){return path(circle.clip(d)); });
            console.log(collection.features[0].geometry.coordinates[0][0]);
            var z = features[0][0].__data__.geometry.coordinates[0][0];
            console.log(z);
            console.log(projection(z));

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

            console.log(texts[0][0].children[211]);
          //  texts[0][0].children[211].attr("opacity",1.0);
    
            //
          
            // t.append("tspan")
            //     .attr("class","globe")
            //     .attr("x",projection(z)[0])
            //     .attr("y",projection(z)[1])
            //     .text("bb");
        });

        d3.json("new_json.json", function(collection) {
            test = d.selectAll(".data").data(collection.ret);
            console.log(collection.data[0]);
            tempStore = collection.data;
            console.log(tempStore);
        });

        //Redraw all items with new projections
        function redraw(){
           

            features.attr("d", function(d){
                return path(circle.clip(d));
            });

            stars.attr("d", function(d){
                spacePath.pointRadius(d.properties.radius);
                return spacePath(d);
            });

        }

        function click(d){
            //d3.select(this).classed("feature",true);

            tooltip.html(tempStore[0].name +"  " + tempStore[0].continent + "<br />"
                  + "感染人数：" + "  " + tempStore[0].confirm + "<br />"
                  + "死亡人数：" + "  " + tempStore[0].dead)
                .style("left", 100 + "px")
                .style("top", 120 + "px")
                .style("opacity",1.0);



            var nowname = d.properties.name;
            for(var num = 211;num<=421;num++){
                var tempText = texts[0][0].children[num];
                if (tempText.innerHTML == nowname){
                    var x = 0,y = 0;
                    var len = d.geometry.coordinates.length;
                    var type = d.geometry.type;
                    if( type[0] == 'M'){
                        for(var i = 0;i<len;i++){
                            console.log(d.geometry.coordinates[0][0][i][0]);
                            x = x + d.geometry.coordinates[0][0][i][0];
                            y = y + d.geometry.coordinates[0][0][i][1];
                        }
                    }
                    else{
                        len = d.geometry.coordinates[0].length;
                        for(var i = 0;i<len;i++){
                            x = x + d.geometry.coordinates[0][i][0];
                            y = y + d.geometry.coordinates[0][i][1];
                        }
                    }

                    // for(var i = 0;i<length;i++){
                    //     var melen = d.geometry.coordinates[i].length;
                    //     for(var j = 0;j<melen;j++){

                    //     }

                    // }
                    x = x/len;
                    y = y/len;
                    var now = [x,y];
                    
                    tempText.getAttributeNode("x").value = projection(now)[0];
                    tempText.getAttributeNode("y").value = projection(now)[1];

                    // tempText.getAttributeNode("x").value = projection(d.geometry.coordinates[0][0])[0];
                    // tempText.getAttributeNode("y").value = projection(d.geometry.coordinates[0][0])[1];

                    tempText.getAttributeNode("opacity").value = 1.0;
                    console.log(tempText.getAttributeNode("x").value);
                    console.log(d.geometry.coordinates);
                    console.log(x);
                }
            }

           // var len = texts[0].len

            // texts.selectAll("text")
            //     .attr("x", function(d){
            //        // console.log(d.geometry.coordinates[0][0])
            //         return projection(d.geometry.coordinates[0][0])[0];
            //     })
            //     .attr("y", function(d){
            //         return projection(d.geometry.coordinates[0][0])[1];
            //     })
            //     .attr("opacity",0.0);


        }

        function click1(d){
            d3.select(this).attr("class", "star");
            tooltip.style("opacity",0.0);
            // texts.selectAll("text")
            //     .attr("opacity",0.0);


            var nowname = d.properties.name;
            for(var num = 211;num<=421;num++){
                var tempText = texts[0][0].children[num];
                if (tempText.innerHTML == nowname){
                    tempText.getAttributeNode("opacity").value = 0.0;
                }
            }
        }


        function move() {
            if(d3.event){
                var scale = d3.event.scale;
                var origin = [d3.event.translate[0] * -1, d3.event.translate[1]];
                
                projection.scale(scale);
                space.scale(scale * 3);
                backgroundCircle.attr('r', scale);
                path.pointRadius(2 * scale / scale0);

                projection.origin(origin);
                circle.origin(origin);
                
                //globe and stars spin in the opposite direction because of the projection mode
                var spaceOrigin = [origin[0] * -1, origin[1] * -1];
                space.origin(spaceOrigin);
                redraw();
            }
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