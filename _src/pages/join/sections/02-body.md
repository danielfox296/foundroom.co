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

  <div class="fr-field">
    <label class="fr-label">How you built it</label>
    <div class="fr-radio-group">
      <label class="fr-radio"><input type="radio" name="howBuilt" value="Bootstrapped / independent"><span>Bootstrapped / independent</span></label>
      <label class="fr-radio"><input type="radio" name="howBuilt" value="Took some funding"><span>Took some funding</span></label>
      <label class="fr-radio"><input type="radio" name="howBuilt" value="Other"><span>Other</span></label>
    </div>
  </div>

  <div class="fr-field">
    <label class="fr-label" for="frExit">Exit size</label>
    <select class="fr-select" id="frExit" name="exitSize">
      <option value="" disabled selected>Select a range</option>
      <option value="Under $500K">Under $500K</option>
      <option value="$500K – $5M">$500K – $5M</option>
      <option value="$5M – $50M">$5M – $50M</option>
      <option value="Over $50M">Over $50M</option>
      <option value="Still operating">Still operating</option>
    </select>
  </div>

  <div class="fr-field">
    <label class="fr-label">What are you looking for right now?</label>
    <div class="fr-radio-group">
      <label class="fr-radio"><input type="radio" name="lookingFor" value="Peers who've actually been through it"><span>Peers who've actually been through it</span></label>
      <label class="fr-radio"><input type="radio" name="lookingFor" value="A room where I don't have to perform"><span>A room where I don't have to perform</span></label>
      <label class="fr-radio"><input type="radio" name="lookingFor" value="Clarity on what comes next"><span>Clarity on what comes next</span></label>
      <label class="fr-radio"><input type="radio" name="lookingFor" value="To not feel like the only one"><span>To not feel like the only one</span></label>
      <label class="fr-radio"><input type="radio" name="lookingFor" value="I'm not sure yet — the usual rooms just don't fit"><span>I'm not sure yet — the usual rooms just don't fit</span></label>
    </div>
  </div>

  <button class="fr-submit" type="submit" id="frSubmit">Join Found Room</button>
  <p class="fr-success" id="frSuccess">You're in. Daniel will be in touch.</p>
  <p class="fr-error" id="frError">Something went wrong. Email daniel@foundroom.co directly.</p>

</form>

<script>
(function() {
  var ENDPOINT = 'APPS_SCRIPT_URL_HERE';

  document.getElementById('frForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = document.getElementById('frSubmit');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    var data = {
      name: document.getElementById('frName').value,
      email: document.getElementById('frEmail').value,
      situation: document.querySelector('input[name="situation"]:checked') ? document.querySelector('input[name="situation"]:checked').value : '',
      howBuilt: document.querySelector('input[name="howBuilt"]:checked') ? document.querySelector('input[name="howBuilt"]:checked').value : '',
      exitSize: document.getElementById('frExit').value,
      lookingFor: document.querySelector('input[name="lookingFor"]:checked') ? document.querySelector('input[name="lookingFor"]:checked').value : ''
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
