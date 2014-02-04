(function() {

  var srcList = [{
    url: "http://elisto04f06.music.yandex.ru/get-mp3/247954a7b5e5fd7c7c17d0ac495355ca/4f18fe10a0a54/14/data-0.16:15147579583:4817396?track-id=2488075&from=service-30-track-album&similarities-experiment=empty",
    name: "Одноклассники"
  }, {
    url: "http://elisto06e.music.yandex.ru/get-mp3/d2ee728bb17646ee97f94d3a7884790c/4f18fe9bd7f79/44/data-0.15:34909974105:5046229?track-id=2488082&from=service-10-track-album&similarities-experiment=empty",
    name: "УГ"
  }, {
    url: "http://elisto03f06.music.yandex.ru/get-mp3/f328b2befa502d4b7640bff50a676363/4f18fe822ddba/13/data-0.2:46054367832:4145945?track-id=2488076&from=service-10-track-album&similarities-experiment=empty",
    name: "Начальник"
  }];

  var viewModel = function() {

    this.currentIndex = ko.observable(0);

    this.audioList = srcList;

    this.curentFile = ko.computed(function() {
      return srcList[this.currentIndex()];
    }, this);

    this.autoplay = ko.observable(true);

    this.next = function() {
      if (this.currentIndex() == srcList.length - 1)
        this.currentIndex(0);
      else
        this.currentIndex(this.currentIndex() + 1);
    };

    this.prev = function() {
      if (this.currentIndex() == 0)
        this.currentIndex(srcList.length - 1);
      else
        this.currentIndex(this.currentIndex() - 1);
    };

    this.ended = function() {
      this.next();
    };
  }

  ko.applyBindings(new viewModel());
})();