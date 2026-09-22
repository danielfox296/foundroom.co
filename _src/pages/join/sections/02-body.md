---
---
<section class="join-body">
<div class="join-prose">

<p>Timothy Leary said "find the others." That's the whole idea.</p>

<p>There are founders who've been through an exit and found the aftermath disorienting. There are founders still running something who've lost the thread. Neither group fits the existing rooms — the optimization masterminds, the wealth management networks, the accountability groups. This is not that.</p>

<p>Free membership means you're in the room. Daniel reads every submission. If it feels like a fit, he'll reach out directly. No funnel. No pitch sequence.</p>

</div>

<form class="fr-form" id="frForm">

  <div class="fr-field">
    <label class="fr-label" for="frName">Your name</label>
    <input class="fr-input" type="text" id="frName" name="name" placeholder="First and last" autocomplete="name">
  </div>

  <div class="fr-field">
    <label class="fr-label" for="frEmail">Email <span class="fr-required">*</span></label>
    <input class="fr-input" type="email" id="frEmail" name="email" placeholder="you@example.com" required autocomplete="email">
  </div>

  <div class="fr-field">
    <label class="fr-label">Your situation</label>
    <div class="fr-radio-group">
      <label class="fr-radio"><input type="radio" name="situation" value="Post-exit"><span>Post-exit</span></label>
      <label class="fr-radio"><input type="radio" name="situation" value="Still operating, lost the thread"><span>Still operating, lost the thread</span></label>
      <label class="fr-radio"><input type="radio" name="situation" value="In a transition"><span>In a transition</span></label>
    </div>
  </div>


<button class="fr-submit" type="submit" id="frSubmit">Join Found Room</button>
  <p class="fr-success" id="frSuccess">You're in. Daniel will be in touch.</p>
  <p class="fr-error" id="frError">Something went wrong. Email daniel@foundroom.co directly.</p>

</form>

<script>
(function() {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxwUvLTTE2GwmLNvx33Bgl1m1dbcXTLWcJqeyPbHjQEq9jfEWOIPcLEcipfSYV2sQk9/exec';

  document.getElementById('frForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = document.getElementById('frSubmit');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    var data = {
      name: document.getElementById('frName').value,
      email: document.getElementById('frEmail').value,
      situation: document.querySelector('input[name="situation"]:checked') ? document.querySelector('input[name="situation"]:checked').value : ''
    };

    fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      document.getElementById('frForm').style.display = 'none';
      document.getElementById('frSuccess').style.display = 'block';
    })
    .catch(function() {
      btn.disabled = false;
      btn.textContent = 'Join Found Room';
      document.getElementById('frError').style.display = 'block';
    });
  });
})();
</script>

</section>
