(function(ko) {

  var playerTemplate = "" +
    "<input class='range' type='range' min=0 step=1 data-bind='value:slider().currentValue, attr:{max:slider().total}, event:{change:slider().timeChanging}'></input>" +
    "<button type='button' data-bind='click:play, visible:isPause()' class='btn play'></button>" +
    "<button type='button' data-bind='click:pause, visible:!isPause()' class='btn pause'></button>" +
    "<button type='button' data-bind='click:mute, css:{active:isMute}' class='btn mute'></button>" +
    "<button type='button' data-bind='click:prev' class='btn prev'></button>" +
    "<button type='button' data-bind='click:next' class='btn next'></button>" +
    "<span  class='trackName' data-bind='text:track() && track().name'></span>",

    isFunction = function(f) {
      return typeof f === "function";
    },

    renderPlayer = function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      element.innerHTML = playerTemplate;
      element.className += " player";
      valueAccessor = getAccessor(valueAccessor, allBindings, viewModel);
      return ko.bindingHandlers.template.init(element, valueAccessor);
    },

    updatePlayer = function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      valueAccessor = getAccessor(valueAccessor, allBindings, viewModel);
      return ko.bindingHandlers.template.update(element, valueAccessor, allBindings, viewModel, bindingContext);
    },

    getAccessor = function(valueAccessor, allBindings, viewModel, updating) {
      return function() {
        var vm = allBindings.audioPlayerVM = allBindings.audioPlayerVM || new Player();
        vm.initOrUpdate(valueAccessor, allBindings, viewModel);
        return {
          templateEngine: ko.nativeTemplateEngine.instance,
          data: vm
        };
      };
    };

  function Track(url, name) {
    this.url = url;
    this.name = name;
  };

  function Slider() {
    var self = this;

    // current track duration
    this.total = ko.observable(0);

    // current track timel
    this.currentValue = ko.observable(0);

    // handled when range input draging
    this.timeChanging = function() {
      var player = this;

      self.manualChanging = true;
      if (self._timer)
        clearTimeout(self._timer);

      self._timer = setTimeout(function() {
        player.timeChanged(self.currentValue());
        self.manualChanging = false;
      }, 500);
    };
  };

  Slider.prototype.setCurrentValue = function(value) {
    !this.manualChanging && (this.currentValue(value));
  };

  function Player() {
    this._init();
  };


  Player.prototype._init = function() {
    this.audio = new Audio();

    this.slider = ko.observable(new Slider());

    this.track = ko.observable();
    this.track.subscribe(function(track) {
      this.audio.src = track.url;
    }, this);

    this.isMute = ko.observable(false);
    this.isMute.subscribe(function(value) {
      if (value)
        this.audio.volume = 0;
      else
        this.audio.volume = 1
    }, this);

    this.isPause = ko.observable(true);
    this._initEvents();
  };

  Player.prototype.play = function() {
    this.audio.play()
  };

  Player.prototype.pause = function() {
    this.audio.pause();
  };

  Player.prototype.mute = function() {
    this.isMute(!this.isMute());
  };

  Player.prototype.timeChanged = function(time) {
    this.audio.currentTime = time;
  };

  Player.prototype.callbackProxy = function(fn, viewModel) {
    var self = this;
    return function() {
      isFunction(fn) && fn.apply(viewModel);
    }
  };

  Player.prototype.createEventsProxy = function(events, viewModel) {
    var self = this;
    return function(eventName, data) {
      var fn = events[eventName];
      isFunction(fn) && fn.call(viewModel, data);
    };
  };

  Player.prototype._initEvents = function() {
    var self = this,
      audio = this.audio;

    audio.addEventListener('timeupdate', function() {
      self.slider().setCurrentValue(audio.currentTime);
      self.slider().total(audio.duration);
      self.eventProxy("timeupdate")
    });

    audio.addEventListener('play', function() {
      self.isPause(false);
      self.eventProxy("play")
    });

    audio.addEventListener('pause', function() {
      self.isPause(true);
      self.eventProxy("pause")
    });

    audio.addEventListener('ended', function() {
      audio.currentTime = 0;
      self.eventProxy("ended")
    });
  };

  Player.prototype.initOrUpdate = function(valueAccessor, allBindings, viewModel) {
    this.track(ko.utils.unwrapObservable(allBindings().audioFile));

    this.audio.autoplay = ko.utils.unwrapObservable(allBindings().autoplay);

    if (this.audio.autoplay) {
      this.play();
    }

    // обработчики на нажатие следующий/предыдущий трек
    this.eventProxy = this.createEventsProxy(ko.utils.unwrapObservable(allBindings().events), viewModel);
    this.next = this.callbackProxy(ko.utils.unwrapObservable(allBindings().nextAudio), viewModel);
    this.prev = this.callbackProxy(ko.utils.unwrapObservable(allBindings().prevAudio), viewModel);
  };

  ko.bindingHandlers.audioPlayer = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      return renderPlayer(element, valueAccessor, allBindings, viewModel, bindingContext);
    },

    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      return updatePlayer(element, valueAccessor, allBindings, viewModel, bindingContext);
    },

    Track: Track
  };


})(ko)