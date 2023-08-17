"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 * - showDeleteBtn: show delete button?
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {

  const hostName = story.getHostName();

  const isLoggedIn = Boolean(currentUser);
  const favorited = currentUser.favorites.some(s => (s.storyId === story.storyId)) ? "fas" : "far"

  const star = !isLoggedIn ? '' : `
      <span class="star">
        <i class="${favorited} fa-star"></i>
      </span>
  `;

  const trash = !showDeleteBtn ? '' : `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>
   `;

  return $(`
      <li id="${story.storyId}">
        ${trash}
        ${star}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}


// create story
$submitForm.on("submit", async (e) => {
  e.preventDefault();

  const story = await storyList.addStory(currentUser, {
    title: $("#create-title").val(),
    url: $("#create-url").val(),
    author: $("#create-author").val(),
    username: currentUser.username
  });

  const $story = generateStoryMarkup(story);

  $allStoriesList.prepend($story);

  $submitForm.hide("slow");
  $submitForm.find("input").val("");
});

// delete story
$owned.on("click", '.trash-can', async (e) => {
  const $li = $(e.target).closest("li");
  await storyList.deleteStory(currentUser, $li.attr("id"));
  await putUserStoriesOnPage();
});

function putUserStoriesOnPage() {
  $owned.empty();

  if (!currentUser.ownStories.length) {
    $owned.append("<h5>No stories added by user yet!</h5>");
    return;
  }

  for (let story of currentUser.ownStories) {
    let $story = generateStoryMarkup(story, true);
    $owned.append($story);
  }
  $owned.show();
}

function putFavoritesListOnPage() {
  $favorites.empty();

  if (!currentUser.favorites.length) {
    $favorites.append("<h5>No favorites added!</h5>");
    return;
  }

  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $favorites.append($story);
  }
  $favorites.show();
}

async function toggleFavorite(user, story, isAdding = true) {
  await axios({
    url: `${BASE_URL}/users/${user.username}/favorites/${story.storyId}`,
    method: isAdding ? "POST" : "DELETE",
    data: { token: user.loginToken },
  });
}

$stories.on("click", ".star", async (e) => {
  const $target = $(e.target);

  const storyId = $target.closest("li").attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  if ($target.hasClass("fas")) {
    currentUser.favorites = currentUser.favorites.filter(s => s.storyId !== story.storyId);
    await toggleFavorite(currentUser, story);
    $target.closest("i").toggleClass("fas far");
  } else {
    currentUser.favorites.push(story);
    await toggleFavorite(currentUser, story, false)
    $target.closest("i").toggleClass("fas far");
  }
});
