/* Simulated third-party analytics tag (console noise is the point). */
(function () {
  var q = [];
  function track(ev, data) {
    q.push([ev, data]);
    console.log('%c[acme-analytics]', 'color:#8b5cf6', ev, data || {});
  }
  console.warn('[acme-analytics] cookie consent not found, falling back to anonymous mode');
  console.info('[acme-analytics] v3.18.2 initialised (sampling 100%)');
  track('page_view', { path: location.pathname });
  var push = history.pushState;
  history.pushState = function () {
    var r = push.apply(this, arguments);
    track('page_view', { path: location.pathname, spa: true });
    return r;
  };
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('button, a');
    if (t) track('click', { text: (t.textContent || '').trim().slice(0, 40) });
  });
  setInterval(function () {
    console.debug('[acme-analytics] flush', q.length, 'events');
    q = [];
  }, 7000);
})();
