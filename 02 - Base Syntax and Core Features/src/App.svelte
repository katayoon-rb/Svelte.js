<script>
  import ContactCart from "./ContactCart.svelte";

  let userName = "Max";
  let jobTitle = "";
  let desc = "";
  let userImg = "";
  let age = 30;

  $: uppercaseName = userName.toUpperCase();
  $: if (userName === "Maximilian") {
    age = 31;
  }

  function incrementAge() {
    age += 1;
  }
  //   function changeName() { userName = "Maximilian"; }
  //   function nameInput(e) { userName = e.target.value; }
</script>

<h1>Hello {uppercaseName}, my age is {age}!</h1>
<button on:click={incrementAge}>Change Age</button>

<!-- <button on:click={changeName}>Change Name</button> -->
<!-- <input type="text" value={userName} on:input={nameInput} /> -->
<input type="text" bind:value={userName} />
<input type="text" bind:value={jobTitle} />
<input type="text" bind:value={userImg} />
<textarea rows="3" bind:value={desc} />

<ContactCart {userName} {jobTitle} {desc} {userImg} />

<style>
  h1 {
    color: purple;
  }
</style>
