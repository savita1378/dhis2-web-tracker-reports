/**
 * Created by hisp on 3/2/16.
 */
var Performance = function(){
    var pointsMap = []

    this.start = function(key){
        pointsMap[key] = {start:0,
                            end:0}
        pointsMap[key].start = window.performance.now();
    }

    this.stop = function(key){
        pointsMap[key].end = window.performance.now();
    }

    this.timeTaken = function(key){
        return pointsMap[key].end - pointsMap[key].start;
    }
}