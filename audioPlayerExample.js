	var srcList = [{
		url:"1.mp3",
		name : "Лучь солнца золотого"
	},
	{
		url : "2.mp3",
		name : "Сказка"
	}
	, 
	{
		url:"3.mp3",
		name : "Песня мамонтенка"
	}
	];

	var viewModel = function(){
		this.currentIndex =ko.observable(0),
		this.audioList = srcList;
		this.curentFile = ko.computed(function(){
			return srcList[this.currentIndex()];
		}, this),

		this.next = function()
		{
			if (this.currentIndex() == srcList.length-1)
				this.currentIndex(0);
			else
				this.currentIndex(this.currentIndex()+1);
		},

		this.prev =function()
		{
			if (this.currentIndex() == 0)
				this.currentIndex(srcList.length-1);
			else
				this.currentIndex(this.currentIndex()-1);
		}

	}

	ko.applyBindings(new viewModel());
