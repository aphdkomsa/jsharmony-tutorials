jsh.App[modelid] = new (function(){
  var _this = this;

  //Member variables
  this.C = [];
  this.LOV = { };
  this.dragTarget = null;
  this.dragType = '';
  this.dragStarted = false;
  this.dragStartTime = 0;
  this.dragDestination = null;

  this.oninit = function(xmodel){
    //Bind event handlers
    $(document).bind('mousemove', _this.onmousemove);
    $(document).bind('mouseup', _this.onmouseup);
    //Load API Data
    this.loadData();
  }

  this.ondestroy = function(){
    //Remove any bound event handlers
    $(document).unbind('mousemove', _this.onmousemove);
    $(document).unbind('mouseup', _this.onmouseup);
  }

  this.help = function(){
    XExt.popupForm('HSHOWL', 'update', { hp_code: 'C_CUSTOM' });
  }

  this.loadData = function(onComplete){
    var emodelid = xmodel.namespace+'C_CUSTOM_GET_C';
    //Execute the C_CUSTOM_GET_C model
    XForm.prototype.XExecutePost(emodelid, { }, function (rslt) { //On Success
      if ('_success' in rslt) {
        //Populate arrays + Render
        _this.C = rslt[emodelid][0];
        _this.LOV.C_STS = rslt[emodelid][1];

        _this.render();
        if (onComplete) onComplete();
      }
      else XExt.Alert('Error while loading data');
    }, function (err) {
      //Optionally, handle errors
    });
  }

  this.updateStatus = function(c_id, c_sts, onComplete){
    //Execute the C_CUSTOM_GET_C model
    XForm.prototype.XExecutePost(xmodel.namespace+'C_CUSTOM_UPDATE_C_STS', { c_id: c_id, c_sts: c_sts }, function (rslt) { //On Success
      if ('_success' in rslt) {
        //Re-render
        _this.loadData(onComplete);
      }
      else XExt.Alert('Error while saving status');
    }, function (err) {
      //Optionally, handle errors
    });
  }

  this.render = function(){
    //Create array of customers per customer status
    var data = { 
      C_STS: [] 
    };
    _.each(_this.LOV.C_STS, function(c_sts){
      var c_per_sts = [];
      _.each(_this.C, function(c){ if(c.c_sts==c_sts.codeval) c_per_sts.push(c); });
      data.C_STS.push(_.extend({}, c_sts, { C: c_per_sts }));
    });
    //Render the EJS template
    var tmpl = jsh.$root('.C_CUSTOM_template').html();
    var jcontainer = jsh.$root('.C_CUSTOM_container');
    jcontainer.html(XExt.renderClientEJS(tmpl, { data: data, _: _, jsh: jsh }));
    //Bind mousedown event for dragging
    jcontainer.find('.C_CUSTOM_customer').mousedown(function(e){
      if(e.which==1){//left mouse button
        e.preventDefault();
        e.stopPropagation();
        _this.dragTarget = $(this);
        _this.dragType = 'c';
        _this.dragBegin();
      }
    });
  }

  //Local handler for "mousemove" event
  this.onmousemove = function(e){
    if(_this.dragTarget){ _this.dragMove(); }
  }

  //Local handler for "mouseup" event
  this.onmouseup = function(e) {
    if(_this.dragTarget){
      _this.dragEnd();
      _this.dragTarget = null;
      e.preventDefault();
      e.stopPropagation();
    }
  }

  //Mouse Drag - Fired on Start
  this.dragBegin = function(){
    $('.xcontext_menu').hide();
    _this.dragStarted = true;

    if(_this.dragType=='c'){
      jsh.$root('.C_CUSTOM_customer.drag').remove();
      var jclone = _this.dragTarget.clone();
      jclone.css({
        position:'absolute',
        zIndex: 999,
        left: jsh.mouseX,
        top: jsh.mouseY,
      });
      jclone.addClass('drag');
      jsh.root.prepend(jclone);
    }
  }

  //Mouse Drag - Fired each time the mouse moves
  this.dragMove = function(){
    if(!_this.dragTarget) return;

    if(_this.dragType=='c'){
      //Update dragged object position
      var jclone = jsh.$root('.C_CUSTOM_customer.drag');
      jclone.css('left', jsh.mouseX);
      jclone.css('top', jsh.mouseY);

      //Highlight background on target container
      var c_sts = '';
      jsh.$root('.C_CUSTOM_status_container').each(function(){
        if(XExt.isMouseWithin(this)){
          c_sts = $(this).data('codeval');
        }
      });
      if(c_sts) _this.dragDestination = jsh.$root('.C_CUSTOM_status_container[data-codeval='+c_sts+']');
      else _this.dragDestination = null;

      jsh.$root('.C_CUSTOM_status_container').not(_this.dragDestination).removeClass('highlighted');
      jsh.$root(_this.dragDestination).addClass('highlighted');
    }
  }

  //Mouse Drag - Fired on Complete
  this.dragEnd = function(){
    if(!_this.dragStarted) return;

    if(_this.dragType=='c'){
      jsh.$root('.C_CUSTOM_customer.drag').remove();
      jsh.$root('.C_CUSTOM_status_container').removeClass('highlighted');
      if(_this.dragDestination){
        var c_id = _this.dragTarget.data('c_id');
        var c_sts = _this.dragDestination.data('codeval');
        //Update status
        _this.updateStatus(c_id, c_sts); 
      }
    }

  }

})();
