(function(ko) {

  var playerTemplate = "" +
    "<input class='range' type='range' min=0 step=1 data-bind='value:currentTime, attr:{max:duration}, event:{change:timeChanging}'></input>" +
    "<button type='button' data-bind='click:play, visible:isPause()' class='btn play'></button>" +
    "<button type='button' data-bind='click:pause, visible:!isPause()' class='btn pause'></button>" +
    "<button type='button' data-bind='click:mute, css:{active:isMute}' class='btn mute'></button>" +
    "<button type='button' data-bind='click:prev' class='btn prev'></button>" +
    "<button type='button' data-bind='click:next' class='btn next'></button>" +
    "<span  class='trackName' data-bind='text:trackName'></span>";

  var isFunction = function(f) {
    return typeof f == "function";
  }

  var audioPlayers = [];
  var ViewModel = function() {
    var self = this;
    var audio = this.audio = new Audio();
    audioPlayers.push(this.audio);
    this.__audioPlayerId = audioPlayers.length - 1;

    // длительность текущего трека
    this.duration = ko.observable(0);

    // текущее время проигрываемого трека
    this.currentTime = ko.observable(0);

    this.isMute = ko.observable(false);
    this.isMute.subscribe(function(value) {
      if (value)
        audio.volume = 0;
      else
        audio.volume = 1
    });

    this.isPause = ko.observable(true);

    // индекс проигрываемого файла в плей листе
    this.currentAudioFileListIndex = ko.observable();

    // проигрываемый файл       
    this.audioFile = ko.observable();
    this.audioFile.subscribe(function(value) {
      audio.src = value.url;
    });

    this.currentAudioFileListIndex.subscribe(function(value) {
      if (self.audioList)
        self.audioFile(self.audioList[value]);
    });

    this.trackName = ko.computed(function() {
      return (this.audioFile() || {}).name || "";
    }, this);

    this.initEvents();

  };

  ViewModel.prototype.timeChanged = function() {
    this.audio.currentTime = this.currentTime();
  };

  ViewModel.prototype.timeChanging = function() {
    var self = this;
    console.log("timeChanging");
    this.manualChanging = true;
    if (this.timer)
      clearTimeout(this.timer);

    this.timer = setTimeout(function() {
      self.timeChanged();
      console.log("timeChanged");
      self.manualChanging = false;
    }, 500);
  }

  ViewModel.prototype.play = function() {
    for (var i = 0; i < audioPlayers.length; i++) {
      audioPlayers[i].pause();
    }
    this.audio.play()
  };

  ViewModel.prototype.pause = function() {
    this.audio.pause();
  };


  ViewModel.prototype.mute = function() {
    this.isMute(!this.isMute());
  };

  ViewModel.prototype.nextTrackInList = function() {
    var audio = this.audio;
    var autoPlay = audio.autoplay;
    audio.autoplay = true;
    audio.currentTime = 0;
    if (this.currentAudioFileListIndex() == this.audioList.length - 1)
      this.currentAudioFileListIndex(0)
    else {
      this.currentAudioFileListIndex(this.currentAudioFileListIndex() + 1);
    }
    audio.play();
    audio.autoplay = autoPlay;
  };

  ViewModel.prototype.prevTrackInList = function() {
    var audio = this.audio;
    var autoPlay = audio.autoplay;
    audio.autoplay = true;
    audio.currentTime = 0;
    if (this.currentAudioFileListIndex() == 0)
      this.currentAudioFileListIndex(this.audioList.length - 1);
    else {
      this.currentAudioFileListIndex(this.currentAudioFileListIndex() - 1);
    }
    audio.play();
    audio.autoplay = autoPlay;
  };


  ViewModel.prototype.initEvents = function() {
    var self = this;
    var audio = this.audio;

    // флаг, ползунок перетаскивается мышкой
    this.manualChanging = false;
    audio.addEventListener('timeupdate', function() {
      self.duration(audio.duration);
      if (!self.manualChanging)
        self.currentTime(audio.currentTime);
    });

    audio.addEventListener('play', function() {
      self.isPause(false);
    });

    audio.addEventListener('pause', function() {
      self.isPause(true);
    });

    audio.addEventListener('ended', function() {
      if (self.audioListNotEmpty) {
        self.nextTrackInList();
      } else {
        audio.currentTime = 0;
        self.isPause(true);
      }
    });
  };

  ViewModel.prototype.initOrUpdate = function(valueAccessor, allBindings, viewModel) {
    var audio = this.audio;

    // объект аудио файла 
    // { url : URL, name :trackName }
    var audioFile = ko.utils.unwrapObservable(allBindings().audioFile);

    // массив объектов audioFile (плейлист)
    var audioList = this.audioList = allBindings().audioList ? ko.utils.unwrapObservable(allBindings().audioList) : null
    this.audioListNotEmpty = audioList && audioList.length > 0;

    if (audioFile) {
      this.audioFile(audioFile);
    } else if (this.audioListNotEmpty) {
      this.currentAudioFileListIndex(0);
    }

    // обработчики на нажатие следующий/предыдущий трек
    this.toNext = ko.utils.unwrapObservable(allBindings().nextAudio);
    this.toPrev = ko.utils.unwrapObservable(allBindings().prevAudio);

    if (audio.autoplay) {
      audio.play();
    }

    this.next = function() {
      if (this.audioListNotEmpty)
        this.nextTrackInList();
      var autoPlay = this.audio.autoplay;
      this.audio.autoplay = true;
      isFunction(this.toNext) && this.toNext.apply(viewModel);
      this.audio.autoplay = autoPlay;
    };

    this.prev = function() {
      if (this.audioListNotEmpty)
        this.prevTrackInList();
      var autoPlay = this.audio.autoplay;
      this.audio.autoplay = true;
      isFunction(this.toPrev) && this.toPrev.apply(viewModel);
      this.audio.autoplay = autoPlay;
    };
  };


  var renderPlayer = function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    element.innerHTML = playerTemplate;
    element.className += " player";
    valueAccessor = getAccessor(valueAccessor, allBindings, viewModel);
    return ko.bindingHandlers.template.init(element, valueAccessor);
  };

  var updatePlayer = function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    valueAccessor = getAccessor(valueAccessor, allBindings, viewModel);
    return ko.bindingHandlers.template.update(element, valueAccessor, allBindings, viewModel, bindingContext);
  }

  var getAccessor = function(valueAccessor, allBindings, viewModel, updating) {
    return function() {
      var vm = allBindings.audioPlayerVM = allBindings.audioPlayerVM || new ViewModel();
      vm.initOrUpdate(valueAccessor, allBindings, viewModel);
      return {
        templateEngine: ko.nativeTemplateEngine.instance,
        data: vm
      };
    };
  };


  ko.bindingHandlers.audioPlayer = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      return renderPlayer(element, valueAccessor, allBindings, viewModel, bindingContext);
    },

    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      return updatePlayer(element, valueAccessor, allBindings, viewModel, bindingContext);
    }
  };

})(ko)