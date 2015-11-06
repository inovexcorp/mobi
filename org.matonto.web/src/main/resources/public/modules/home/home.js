(function() {
    'use strict';

    angular
        .module('app')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$http'];

    function HomeController($http) {
        var vm = this;

        activate();

        function activate() {
            // d3Test();
        }

        // Testing out the d3 library and feasibility of incorporating that in our provided widgets
        function d3Test() {
            var data = [4, 8, 15, 16, 23, 42],

                width = 420,
                barHeight = 20,

                x = d3.scale.linear()
                    .domain([0, d3.max(data)])
                    .range([0, width]),

                chart = d3.select('.chart')
                    .attr('width', width)
                    .attr('height', barHeight * data.length),

                bar = chart.selectAll('g')
                    .data(data)
                    .enter().append('g')
                    .attr('transform', function(d, i) { return 'translate(0,' + i * barHeight + ')'; });

            bar.append('rect')
                .attr('width', x)
                .attr('height', barHeight - 1);

            bar.append('text')
                .attr('x', function(d) { return x(d) - 3; })
                .attr('y', barHeight / 2)
                .attr('dy', '.35em')
                .text(function(d) { return d; });

            // chart made with divs
            /* d3.select('.chart')
                .selectAll('div')
                .data(data)
                .enter().append('div')
                .style('width', function(d) { return x(d) + 'px'; })
                .text(function(d) { return d; }); */
        }
    }
})();
