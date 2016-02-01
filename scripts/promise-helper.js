/**
 * Created by harsh on 28/1/16.
 */

var pipeline = function(index,threshhold,iterations,callback){

        var _index = index;
        var _threshhold = threshhold;
        var _iterations = iterations;
        var _callback = callback;
    var _index_done = 0;
    this.done = $.Deferred();
    this.run = function(){

        if (_index >= _iterations){
            return
        }

        if ((_index - _index_done) < _threshhold) {
            _callback(_index,this);
            _index = _index+1;
        }else{
            return
        }

        this.run();
    }

    this.removeItem = function(){
        _index_done = _index_done + 1;
        if(_index_done ==  _index){
            this.done.resolve("Done");
        }else {
            this.run();
        }
    }

};

var promiseTracker = function(){

    _no = 0;
    _done = 0;
    this.done = $.Deferred();

    this.push = function(){
        _no = _no+1;
    }

    pop = function(){
        _done = _done+1
    }

    this.notify = function(){
        pop();
        this.isDone();
    }

    this.isDone = function(){
        if (_no == _done){
            this.done.resolve("done");
            return true;
        }
    return false;
    }
}
