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
                    maxResults: 10,
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
                    playerVideo.stopVideo();
                    $("#player-video").remove();
                    playerVideo = null;
                    // videoStartPosition = 0;
                }
                if (playerAudio) {
                    playerAudio.stopVideo();
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
                        fs: '0',
                        modestbranding: '1',
                        rel: '0',
                        showinfo: '0',
                        iv_load_policy: '3',
                        enablejsapi: '1'
                    },
                    width: 560,
                    height: 460,
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

                            console.log(event);
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
                            console.log(event);
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
        .when('/:videoId/:audioId/', {
            controller: 'RootCtrl',
        })
        .when('/:videoId/:audioId/:videoStart/:audioStart/', {
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

    $scope.$route = $route;
    $scope.$location = $location;
    $scope.$routeParams = $routeParams;

    function findTopVideos(params) {
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        return Rx.Observable
            .fromPromise(MostPopularVideos.find(params).$promise)
            .map(function (response) {
                var targetIndex = getRandomInt(0, response.length - 1);

                console.log("Target index", targetIndex, "total length", response.length);
                return response[targetIndex];
            });
    }


    function reloadVideosAndAudioCompletely() {
        Rx.Observable.zip(
            findTopVideos({regionCode: 'lt', videoCategoryId: 15}),
            findTopVideos({regionCode: 'us', videoCategoryId: 10})
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


        if (params) {
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
    $rootScope.$on('VideoLoaded', function (event, data) {
        var durations = VideoPlayer.getDurations();

        $scope.model.videoDuration = durations.playerVideoDuration;
        $scope.model.audioDuration = durations.playerAudioDuration;

        $scope.model.videoStartPosition = VideoPlayer.videoStart();
        $scope.model.audioStartPosition = VideoPlayer.audioStart();
        $scope.$apply();
    });

    $scope.$watch('model.videoStartPosition', function (value) {
        VideoPlayer.setVideoStartPosition(value);
        var params = {
            videoStart: VideoPlayer.videoStart(),
        };
        $route.updateParams(params);
    });

    $scope.$watch('model.audioStartPosition', function (value) {
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
    }

    $scope.reloadCompletely = function () {
        $rootScope.$emit('ReloadCompletely');
    }
});

ydAppModule.controller('RepickRelatedCtrl', function ($scope, $rootScope, $route, VideoPlayer, RelatedVideos, CaptureLocation) {

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

    $scope.repickVideo = function () {
        getRelatedVideos(VideoPlayer.videoId())
            .subscribe(
                function (x) {
                    var newVideoId = x.id.videoId;
                    $route.updateParams({videoId: newVideoId});
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

                    $route.updateParams({audioId: newAudioId});
                    $rootScope.$apply();
                },
                function (err) {
                    console.error('Error: %s', err);
                });
    };
});

ydAppModule.controller('VideoSearch', function ($scope, $rootScope, observeOnScope, SearchVideos, $route) {
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
            $scope.model.videos = videos;
            $scope.$apply();
        });

    $scope.select = function (video) {
        $route.updateParams({videoId: video.id.videoId});
        // $rootScope.$apply();
    };
});

ydAppModule.controller('AudioSearch', function ($scope, $rootScope, observeOnScope, SearchVideos, $route) {
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
            $scope.model.videos = videos;
            $scope.$apply();
        });

    $scope.select = function (video) {
        $route.updateParams({audioId: video.id.videoId});
        // $rootScope.$apply();
    };
});