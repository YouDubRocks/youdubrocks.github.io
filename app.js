var ydServices = angular.module('ydServices', ['ngResource']);
ydServices.factory('MostPopularVideos', ['$resource',
    function ($resource) {
        return $resource('https://www.googleapis.com/youtube/v3/videos', {}, {
            find: {
                method: 'GET',
                params: {
                    part: 'snippet',
                    chart: 'mostPopular',
                    // regionCode: 'es',
                    // videoCategoryId: '10',
                    maxResults: 50,
                    key: 'AIzaSyBCEPs6IYrA3P4tRNKNU_TQmhRt2NsX6aY',
                },
                isArray: true,
                transformResponse: function (data, headersGetter) {
                    data = angular.fromJson(data);
                    return data['items'];
                }
            }
        });
    }]
);
ydServices.factory('VideoInfo', ['$resource',
    function ($resource) {
        return $resource('https://www.googleapis.com/youtube/v3/videos', {}, {
            findOne: {
                method: 'GET',
                params: {
                    part: 'snippet',
                    key: 'AIzaSyBCEPs6IYrA3P4tRNKNU_TQmhRt2NsX6aY',
                },
                isArray: false,
                transformResponse: function (data, headersGetter) {
                    data = angular.fromJson(data);
                    return data['items'][0];
                }
            }
        });
    }]
);
ydServices.factory('RelatedVideos', ['$resource',
    function ($resource) {
        return $resource('https://www.googleapis.com/youtube/v3/search', {}, {
            find: {
                method: 'GET',
                params: {
                    part: 'snippet',
                    // relatedToVideoId: 'mostPopular',
                    type: 'video',
                    maxResults: 25,
                    key: 'AIzaSyBCEPs6IYrA3P4tRNKNU_TQmhRt2NsX6aY',
                },
                isArray: true,
                transformResponse: function (data, headersGetter) {
                    data = angular.fromJson(data);
                    return data['items'];
                }
            }
        });
    }]
);
ydServices.factory('SearchVideos', ['$resource',
    function ($resource) {
        return $resource('https://www.googleapis.com/youtube/v3/search', {}, {
            find: {
                method: 'GET',
                params: {
                    part: 'snippet',
                    type: 'video',
                    order: 'viewCount',
                    videoDefinition: 'any',
                    maxResults: 20,
                    key: 'AIzaSyBCEPs6IYrA3P4tRNKNU_TQmhRt2NsX6aY',
                },
                isArray: true,
                transformResponse: function (data, headersGetter) {
                    data = angular.fromJson(data);
                    return data['items'];
                }
            }
        });
    }]
);

ydServices.service('VideoPlayer', function ($rootScope) {
        var playerAudio;
        var playerVideo;

        var videoStartPosition = 0;
        var audioStartPosition = 0;

        var _videoId;
        var _audioId;

        return {
            videoStart: function () {
                return videoStartPosition;
            },
            audioStart: function () {
                return audioStartPosition;
            },
            playPause: function () {
                if (playerAudio.getPlayerState() == YT.PlayerState.PLAYING
                    || playerVideo.getPlayerState() == YT.PlayerState.PLAYING) {
                    playerAudio.pauseVideo();
                    playerVideo.pauseVideo();
                } else {
                    playerVideo.seekTo(videoStartPosition, true);
                    playerAudio.seekTo(audioStartPosition, true);

                    playerVideo.playVideo();
                    playerAudio.playVideo();
                }
            },
            videoId: function () {
                return _videoId;
            },
            audioId: function () {
                return _audioId;
            },
            setVideoStartPosition: function (position) {
                if (position == videoStartPosition) {
                    return;
                }

                videoStartPosition = position;
                if (!playerAudio || !playerVideo) {
                    return;
                }
                playerAudio.pauseVideo();
                playerVideo.pauseVideo();
                playerVideo.seekTo(videoStartPosition, true);
            },
            setAudioStartPosition: function (position) {
                if (position == audioStartPosition) {
                    return;
                }

                audioStartPosition = position;

                if (!playerAudio || !playerVideo) {
                    return;
                }
                playerAudio.pauseVideo();
                playerVideo.pauseVideo();
                playerAudio.seekTo(audioStartPosition, true);
            },
            getDurations: function () {
                return {
                    playerVideoDuration: playerVideo.getDuration(),
                    playerAudioDuration: playerAudio.getDuration(),
                };
            },
            pause: function () {
                playerAudio.pauseVideo();
                playerVideo.pauseVideo();
            },
            startMix: function (videoId, audioId) {
                console.log("starting", videoId, audioId);
                _audioId = audioId;
                _videoId = videoId;

                if (playerVideo) {
                    try {
                        playerVideo.stopVideo();
                    }
                    catch (err) {
                        console.log(err);
                    }
                    $("#player-video").remove();
                    playerVideo = null;
                    // videoStartPosition = 0;
                }
                if (playerAudio) {
                    try {
                        playerAudio.stopVideo();
                    }
                    catch (err) {
                        console.log(err);
                    }
                    $("#player-audio").remove();
                    playerAudio = null;
                    // audioStartPosition = 0;
                }

                $("#video-container").append("<div id='player-audio'></div>");
                $("#video-container").append("<div id='player-video'></div>");

                var isVideoLoaded = false;
                var isAudioLoaded = false;

                function checkAndPlay() {
                    if (!isAudioLoaded || !isVideoLoaded) {
                        return;
                    }


                    playerVideo.seekTo(videoStartPosition, true);
                    playerAudio.seekTo(audioStartPosition, true);
                    // playerVideo.pauseVideo();
                    // playerAudio.pauseVideo();
                    // playerVideo.playVideo();
                    playerVideo.mute();
                    // playerAudio.mute();
                    // playerAudio.playVideo();


                    ga('send', 'event', 'Player', 'StartedPlaying');

                    $rootScope.$emit('VideoLoaded', {
                        playerVideo: playerVideo,
                        playerAudio: playerAudio,
                    });

                }


                console.log("onYouTubePlayerAPIReady");

                playerVideo = new YT.Player('player-video', {
                    videoId: videoId,
                    playerVars: {
                        controls: '0',
                        disablekb: '1',
                        loop: '1',
                        fs: '0',
                        modestbranding: '1',
                        rel: '0',
                        showinfo: '0',
                        iv_load_policy: '3',
                        enablejsapi: '1'
                    },
                    width: "100%",
                    height: 416,
                    events: {
                        'onReady': function (event) {
                            console.log("onReady Video starting", event, videoId);
                            isVideoLoaded = true;
                            checkAndPlay();
                        },
                        'onStateChange': function (event) {
                            if (event.data == YT.PlayerState.PAUSED) {
                                playerAudio.pauseVideo();
                            }

                            if (event.data == YT.PlayerState.PLAYING) {
                                playerAudio.playVideo();
                            }

                            // console.log(event);
                        },
                        'onError': function (event) {
                            console.log(event);
                        }
                    }
                });

                playerAudio = new YT.Player('player-audio', {
                    videoId: audioId,
                    playerVars: {
                        controls: '0',
                        disablekb: '1',
                        loop: '1',
                        fs: '0',
                        modestbranding: '1',
                        rel: '0',
                        showinfo: '0',
                        iv_load_policy: '3',
                        enablejsapi: '1'
                    },
                    width: 10,
                    height: 10,
                    events: {
                        'onReady': function (event) {
                            console.log("onReady Audio starting", event, audioId);
                            isAudioLoaded = true;
                            checkAndPlay();
                        },
                        'onStateChange': function (event) {
                            // console.log(event);/
                        },
                        'onError': function (event) {
                            console.log(event);
                        }
                    }
                });
            }
        }
    }
);

var ydAppModule = angular.module('youdub', ['ngRoute', 'ydServices', 'ngMaterial', 'rx']);
ydAppModule.config(function ($routeProvider, $locationProvider) {
    $routeProvider
        .when('/:videoId/:audioId/:videoStart?/:audioStart?/', {
            controller: 'RootCtrl',
        })
        .otherwise({
            redirectTo: "/c1/c2/0/0"
            // videoId: '',
            // audioId: '',
            // videoStart: 0,
            // audioStart: 0,
        });
});
ydAppModule.service('CaptureLocation', function ($rootScope, $route, VideoPlayer, $location, $timeout) {
    return {
        capture: function () {
            var params = {
                videoId: VideoPlayer.videoId(),
                audioId: VideoPlayer.audioId(),
                videoStart: VideoPlayer.videoStart(),
                audioStart: VideoPlayer.audioStart(),
            };
            $route.updateParams(params);
            $rootScope.$apply();
            // $timeout(function () {
            //     $location.url("/" + params.videoId + "/" + params.audioId + "/" + params.videoStart + "/" + params.audioStart);
            //     $rootScope.$apply();
            //     console.log("Updated new location path", params);
            // }, 0);
        }

    };
});

ydAppModule.controller('RouteParamCtrl', function ($scope, $rootScope, MostPopularVideos, VideoPlayer) {
    $rootScope.$on('$routeChangeStart', function (event, data) {
        console.log("Route change start", event, data);
    });
});


ydAppModule.controller('RootCtrl', function ($scope, $rootScope, $routeParams, $location, $route, MostPopularVideos, VideoPlayer, CaptureLocation) {

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function findTopVideos(params) {

        return Rx.Observable
            .fromPromise(MostPopularVideos.find(params).$promise)
            .map(function (response) {
                var targetIndex = getRandomInt(0, response.length - 1);

                console.log("Target index", targetIndex, "total length", response.length);
                return response[targetIndex];
            });
    }


    function reloadVideosAndAudioCompletely() {
        var languages = [
            "US", "AU", "CA",
            "CZ", "DK", "EE",
            "FR",
            "DE",
            "JP",
            "NO",
            "RU",
            "GB"
        ];

        var languageIndexFirst = getRandomInt(0, languages.length - 1);
        var languageIndexSecond = getRandomInt(0, languages.length - 1);

        Rx.Observable.zip(
            findTopVideos({regionCode: languages[languageIndexFirst]}),
            findTopVideos({regionCode: languages[languageIndexSecond]})
        )
            .subscribe(
                function (x) {
                    var firstVideo = x[0];
                    var secondVideo = x[1];

                    if (!firstVideo || !secondVideo) {
                        console.warn("Video not found", firstVideo, secondVideo);
                        return;
                    }

                    console.log("Found random video", firstVideo.snippet.title,
                        " --- Found random audio", secondVideo.snippet.title);

                    var videoId = firstVideo.id;
                    var audioId = secondVideo.id;

                    $route.updateParams({audioId: audioId, videoId: videoId, videoStart: 0, audioStart: 0});
                    $rootScope.$apply();
                },
                function (err) {
                    console.log('Error: %s', err);
                },
                function () {
                    console.log('Completed');
                });
    }

    $rootScope.$on('ReloadCompletely', function (event) {
        reloadVideosAndAudioCompletely();
    });

    $rootScope.$on('$routeChangeSuccess', function (event, data, old) {
        console.log("Route change success", data, old);
        console.log($route.current);
        var params = data.params;


        if (!jQuery.isEmptyObject(params)) {
            var videoId = params['videoId'];
            var audioId = params['audioId'];
            var videoStart = params['videoStart'];
            var audioStart = params['audioStart'];

            console.log("Got route params and starting - prime", videoId, audioId);

            VideoPlayer.setVideoStartPosition(videoStart);
            VideoPlayer.setAudioStartPosition(audioStart);

            if (!videoId || !audioId) {
                console.log("Audio or Video ID is not set - returning");
                return;
            }

            if (videoId == 'c1' && audioId == 'c2') {
                console.log("Fetching randomized videos", videoId, audioId);

                reloadVideosAndAudioCompletely();
                return;
            }

            if (old
                && data.params['videoId'] == old.params['videoId']
                && data.params['audioId'] == old.params['audioId']) {
                return;
            }

            window.youTubeApiLoaded.subscribe(function (apiLoaded) {
                console.log("Got route params and starting", videoId, audioId, apiLoaded);
                if (apiLoaded) {
                    VideoPlayer.startMix(videoId, audioId);
                }
            });
        }
    });


    //     window.onYouTubePlayerAPIReady = function () {
    //         VideoPlayer.startMix("M7lc1UVf-VE", "xiTOUpzRpss");
    //     }

});

ydAppModule.controller('StartTimeCtrl', function ($scope, $rootScope, $route, VideoPlayer, CaptureLocation, $timeout) {
    $scope.model = {};
    var initialized = false;

    $rootScope.$on('VideoLoaded', function (event, data) {
        var durations = VideoPlayer.getDurations();

        $scope.model.videoDuration = durations.playerVideoDuration;
        $scope.model.audioDuration = durations.playerAudioDuration;

        $scope.model.videoStartPosition = VideoPlayer.videoStart();
        $scope.model.audioStartPosition = VideoPlayer.audioStart();

        initialized = true;

        $scope.$apply();
    });

    $scope.$watch('model.videoStartPosition', function (value) {
        if (!initialized) {
            return;
        }
        VideoPlayer.setVideoStartPosition(value);
        var params = {
            videoStart: VideoPlayer.videoStart(),
        };
        $route.updateParams(params);
    });

    $scope.$watch('model.audioStartPosition', function (value) {
        if (!initialized) {
            return;
        }
        VideoPlayer.setAudioStartPosition(value);
        var params = {
            audioStart: VideoPlayer.audioStart(),
        };
        $route.updateParams(params);
    });
});

ydAppModule.controller('StopStartCtrl', function ($scope, $rootScope, VideoPlayer) {
    $scope.playPause = function () {
        VideoPlayer.playPause();
    };

    $scope.reloadCompletely = function () {
        $rootScope.$emit('ReloadCompletely');
        ga('send', 'event', 'Video', 'Refresh');
    };
});

ydAppModule.controller('RepickRelatedCtrl', function ($scope, $rootScope, $route, VideoPlayer, RelatedVideos, CaptureLocation, VideoInfo) {

    function getRelatedVideos(videoId) {
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        return Rx.Observable
            .fromPromise(RelatedVideos.find({relatedToVideoId: videoId}).$promise)
            .map(function (response) {
                var targetIndex = getRandomInt(0, response.length - 1);
                console.log("Target index", targetIndex, "total length", response.length);
                return response[targetIndex];
            });
    }

    function getVideoInfo(videoId) {
        return Rx.Observable
            .fromPromise(VideoInfo.findOne({id: videoId}).$promise)
            .map(function (response) {
                return response;
            });
    }

    $scope.repickVideo = function () {
        getRelatedVideos(VideoPlayer.videoId())
            .subscribe(
                function (x) {
                    var newVideoId = x.id.videoId;
                    $route.updateParams({videoId: newVideoId, videoStart: 0});
                    $rootScope.$apply();

                    console.log("New video", x.snippet.title);
                },
                function (err) {
                    console.error('Error: %s', err);
                });
    };

    $scope.repickAudio = function () {
        getRelatedVideos(VideoPlayer.audioId())
            .subscribe(
                function (x) {
                    var newAudioId = x.id.videoId;
                    console.log("New audio", x.snippet.title);

                    $route.updateParams({audioId: newAudioId, audioStart: 0});
                    $rootScope.$apply();
                },
                function (err) {
                    console.error('Error: %s', err);
                });
    };

    $rootScope.$on('VideoLoaded', function (event, data) {
        var audioId = VideoPlayer.audioId();
        var videoId = VideoPlayer.videoId();

        Rx.Observable
            .zip(
                getVideoInfo(audioId),
                getVideoInfo(videoId)
            )
            .subscribe(
                function (x) {
                    var firstVideo = x[0];
                    var secondVideo = x[1];

                    if (!firstVideo || !secondVideo) {
                        console.warn("Video not found", firstVideo, secondVideo);
                        return;
                    }

                    $scope.videoTitle = secondVideo.snippet.title;
                    $scope.audioTitle = firstVideo.snippet.title;

                    $rootScope.videoTitle = $scope.videoTitle;
                    $rootScope.audioTitle = $scope.audioTitle;

                    $scope.audioHref = "https://www.youtube.com/watch?v=" + audioId;
                    $scope.videoHref = "https://www.youtube.com/watch?v=" + videoId;

                    $scope.$apply();
                },
                function (err) {
                    console.log('Error: %s', err);
                },
                function () {
                    console.log('Completed');
                });

    });
});

ydAppModule.controller('VideoAudioSearchTabsCtrl', function ($scope, $rootScope, observeOnScope, SearchVideos, $route) {
    $scope.videoVisible = true;

    $scope.showVideo = function () {
        $scope.videoVisible = true;
    };

    $scope.showAudio = function () {
        $scope.videoVisible = false;
    };
});

ydAppModule.controller('SharingCtrl', function ($scope, $rootScope) {

    $scope.twitter = function () {
        ga('send', 'event', 'Share', 'Twitter');
        var url = window.location;
        var twitterHandle = "YouDubRocks";
        window.open("https://twitter.com/share?url=" + encodeURIComponent(url) + '&text=' + document.title + ' via @' + twitterHandle,
            '',
            'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
    };
    $scope.facebook = function () {
        ga('send', 'event', 'Share', 'Facebook');
        // var url =  encodeURIComponent(window.location);
        var url = window.location.toString();
        var quote = "Mix of " + $rootScope.videoTitle + " and " + $rootScope.audioTitle;
        
        FB.ui({
            method: 'share',
            quote: quote,
            href: url,
        }, function (response) {
            console.log(response);
        });
    };
});

ydAppModule.controller('VideoSearch', function ($scope, $rootScope, observeOnScope, SearchVideos, $route, VideoPlayer) {
    $scope.model = {};

    observeOnScope($scope, 'model.videoQuery')
        .map(function (data) {
            return data.newValue;
        })
        .debounce(330)
        .flatMapLatest(function (term) {
            if (!term) {
                return Rx.Observable.empty();
            }
            return SearchVideos.find({q: term}).$promise
        })
        .subscribe(function (videos) {
            console.log("Searched ", videos);
            ga('send', 'event', 'Search', 'Video');
            $scope.model.videos = videos;
            $scope.$apply();
        });

    $scope.selectVideo = function (video) {
        ga('send', 'event', 'Search', 'VideoSelect');
        $route.updateParams({videoId: video.id.videoId, videoStart: 0});
    };
});

ydAppModule.controller('AudioSearch', function ($scope, $rootScope, observeOnScope, SearchVideos, $route, VideoPlayer) {
    $scope.model = {};

    observeOnScope($scope, 'model.audioQuery')
        .map(function (data) {
            return data.newValue;
        })
        .debounce(330)
        .flatMapLatest(function (term) {
            if (!term) {
                return Rx.Observable.empty();
            }
            return SearchVideos.find({q: term}).$promise
        })
        .subscribe(function (videos) {
            console.log("Searched ", videos);
            ga('send', 'event', 'Search', 'Audio');
            $scope.model.videos = videos;
            $scope.$apply();
        });

    $scope.selectAudio = function (video) {
        ga('send', 'event', 'Search', 'AudioSelect');
        $route.updateParams({audioId: video.id.videoId, audioStart: 0});
    };
});