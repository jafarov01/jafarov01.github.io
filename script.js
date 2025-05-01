$(window).bind('scroll', function(e) {
    parallaxScroll();
});

function parallaxScroll() {
    if (typeof window === 'undefined' || typeof $ === 'undefined') {
        return;
    }

    var scrolled = $(window).scrollTop();

    $('.layer-1').css('top', (0 - (scrolled * 0.15)) + 'px');
    $('.layer-2').css('top', (0 - (scrolled * 0.35)) + 'px');
    $('.layer-3').css('top', (0 - (scrolled * 0.60)) + 'px');

    $('.icon-1').css('top', (150 - (scrolled * 0.8)) + 'px');
    $('.icon-2').css('top', (250 - (scrolled * 0.5)) + 'px');
    $('.icon-3').css('top', (400 - (scrolled * 0.7)) + 'px');
    $('.icon-4').css('top', (500 - (scrolled * 0.4)) + 'px');
    $('.icon-5').css('top', (650 - (scrolled * 0.9)) + 'px');
    $('.icon-6').css('top', (750 - (scrolled * 0.6)) + 'px');
    $('.icon-8').css('top', (850 - (scrolled * 0.45)) + 'px');
    $('.icon-9').css('top', (950 - (scrolled * 0.55)) + 'px');

    var $h1 = $('h1');
    if ($h1.length) {
         var initialTopPercent = 50;
         var h1ScrollFactor = 0.50;
         var newTop = initialTopPercent - (scrolled / $(window).height() * 100 * h1ScrollFactor);
         $h1.css('top', Math.max(5, newTop) + '%');
    }
}

$(document).ready(function() {
    parallaxScroll();
});
