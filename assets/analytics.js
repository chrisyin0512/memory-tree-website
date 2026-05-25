(function () {
  var projectToken = "phc_sVjJz8TNE7WZhTuVnPvFLVnSvyiFdsUY455JmPe4hWrx";
  var apiHost = "https://us.i.posthog.com";
  var localHosts = ["localhost", "127.0.0.1", "::1"];
  var isLocal = localHosts.indexOf(window.location.hostname) !== -1;
  var depthMarks = [25, 50, 75, 100];
  var sentDepths = {};

  if (isLocal || window.navigator.doNotTrack === "1") {
    return;
  }

  function stripSensitiveUrl(value) {
    if (!value) {
      return value;
    }

    try {
      var url = new URL(value, window.location.origin);
      url.search = "";
      url.hash = "";
      return url.toString();
    } catch (_) {
      return value;
    }
  }

  function scrubProperties(properties) {
    var clean = properties || {};
    clean.$current_url = stripSensitiveUrl(clean.$current_url);
    clean.$referrer = stripSensitiveUrl(clean.$referrer);

    Object.keys(clean).forEach(function (key) {
      if (/token|code|password|secret|session|auth/i.test(key)) {
        delete clean[key];
      }
    });

    return clean;
  }

  /* eslint-disable */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags reloadFeatureFlags getFeatureFlag getFeatureFlagPayload group get_group_property featureFlags.onFeatureFlagsLoaded".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  /* eslint-enable */

  posthog.init(projectToken, {
    api_host: apiHost,
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    defaults: "2026-01-30",
    disable_session_recording: true,
    person_profiles: "identified_only",
    sanitize_properties: scrubProperties
  });

  function capture(eventName, properties) {
    if (!window.posthog || typeof window.posthog.capture !== "function") {
      return;
    }

    window.posthog.capture(eventName, scrubProperties(properties));
  }

  function linkKind(link) {
    var href = link.getAttribute("href") || "";

    if (href.indexOf("mailto:") === 0) {
      return "email";
    }

    if (href.indexOf("memorytree://") === 0) {
      return "app_deep_link";
    }

    if (href.indexOf("apps.apple.com") !== -1) {
      return "app_store";
    }

    if (/^https?:\/\//.test(href) && href.indexOf(window.location.hostname) === -1) {
      return "external";
    }

    return "internal";
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href]");

    if (!link) {
      return;
    }

    var kind = linkKind(link);
    capture(kind === "internal" ? "website_navigation_clicked" : "website_link_clicked", {
      link_kind: kind,
      link_text: (link.textContent || "").trim().slice(0, 80),
      path: window.location.pathname
    });
  });

  document.addEventListener("toggle", function (event) {
    if (event.target.tagName !== "DETAILS") {
      return;
    }

    capture("website_faq_toggled", {
      is_open: event.target.open,
      path: window.location.pathname
    });
  }, true);

  window.addEventListener("scroll", function () {
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;

    if (scrollable <= 0) {
      return;
    }

    var depth = Math.round((window.scrollY / scrollable) * 100);
    depthMarks.forEach(function (mark) {
      if (depth >= mark && !sentDepths[mark]) {
        sentDepths[mark] = true;
        capture("scroll_depth", {
          depth_percentage: mark,
          path: window.location.pathname
        });
      }
    });
  }, { passive: true });
})();
