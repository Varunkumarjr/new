// public/js/client.js
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // Assume the logged-in username is provided somehow.
  // For demo purposes, we use a global variable.
  window.loggedInUser = "DemoUser"; // Replace with actual value from session

  // ----- Personal Chat (Friend Page) -----
  const sendChatBtn = document.getElementById('send-chat-btn');
  if(sendChatBtn) {
    sendChatBtn.addEventListener('click', () => {
      const chatInput = document.getElementById('chat-input');
      const message = chatInput.value;
      const from = window.loggedInUser;
      if(message.trim() !== "") {
        socket.emit('chat message', { from, message });
      }
      chatInput.value = '';
    });
  }

  socket.on('chat message', (data) => {
    appendMessage('chat-box', data.from, data.message);
  });

  // ----- Blog Creation (Home Page) -----
  const createBlogBtn = document.getElementById('create-blog-btn');
  const createBlogModal = document.getElementById('create-blog-modal');
  const closeBlogModal = document.getElementById('close-blog-modal');
  const submitBlogBtn = document.getElementById('submit-blog');

  if(createBlogBtn) {
    createBlogBtn.addEventListener('click', () => {
      createBlogModal.style.display = 'block';
    });
  }
  if(closeBlogModal) {
    closeBlogModal.addEventListener('click', () => {
      createBlogModal.style.display = 'none';
    });
  }
  if(submitBlogBtn) {
    submitBlogBtn.addEventListener('click', () => {
      const content = document.getElementById('blog-content').value;
      const imageInput = document.getElementById('blog-image');
      const username = window.loggedInUser;
      if(imageInput && imageInput.files && imageInput.files[0]) {
        const formData = new FormData();
        formData.append('blogImage', imageInput.files[0]);
        fetch('/upload', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          const imageUrl = data.url;
          socket.emit('create blog', { username, content, image: imageUrl });
          createBlogModal.style.display = 'none';
        })
        .catch(err => {
          console.error(err);
          createBlogModal.style.display = 'none';
        });
      } else {
        socket.emit('create blog', { username, content, image: null });
        createBlogModal.style.display = 'none';
      }
    });
  }

  socket.on('new blog', (blog) => {
    const blogList = document.getElementById('blog-list');
    if(blogList) {
      const blogDiv = document.createElement('div');
      blogDiv.classList.add('blog');
      blogDiv.innerHTML = `<strong>${blog.username}</strong>: ${blog.content}<br>
        ${blog.image ? `<img src="${blog.image}" alt="Blog Image" class="blog-image">` : ''}
        <br>Likes: <span id="likes-${blog.id}">${blog.likes}</span>
        <button class="like-btn" data-id="${blog.id}">Like</button>
        <div class="comments" id="comments-${blog.id}"></div>
        <input type="text" placeholder="Comment..." class="comment-input" data-id="${blog.id}">
        <button class="comment-btn" data-id="${blog.id}">Comment</button>`;
      blogList.prepend(blogDiv);
    }
  });

  socket.on('blog updated', (blog) => {
    const likesSpan = document.getElementById(`likes-${blog.id}`);
    if(likesSpan) {
      likesSpan.textContent = blog.likes;
    }
  });

  socket.on('blog comment', (data) => {
    const commentsDiv = document.getElementById(`comments-${data.blogId}`);
    if(commentsDiv) {
      const p = document.createElement('p');
      p.textContent = `${data.username}: ${data.comment}`;
      commentsDiv.appendChild(p);
    }
  });

  document.addEventListener('click', (e) => {
    if(e.target.classList.contains('like-btn')) {
      const blogId = e.target.getAttribute('data-id');
      socket.emit('blog like', { blogId });
    }
    if(e.target.classList.contains('comment-btn')) {
      const blogId = e.target.getAttribute('data-id');
      const input = document.querySelector(`.comment-input[data-id="${blogId}"]`);
      const comment = input.value;
      const username = window.loggedInUser;
      if(comment.trim() !== "") {
        socket.emit('blog comment', { blogId, username, comment });
      }
      input.value = '';
    }
  });

  // ----- User Search (Home Page) -----
  const searchBtn = document.getElementById('search-btn');
  if(searchBtn) {
    searchBtn.addEventListener('click', () => {
      const query = document.getElementById('search-user').value;
      fetch(`/search/users?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(users => {
          let resultContainer = document.getElementById('search-results');
          if(!resultContainer) {
            resultContainer = document.createElement('div');
            resultContainer.id = 'search-results';
            document.body.appendChild(resultContainer);
          }
          resultContainer.innerHTML = '';
          users.forEach(user => {
            const div = document.createElement('div');
            div.classList.add('search-result');
            div.textContent = `${user.username} (${user.email})`;
            resultContainer.appendChild(div);
          });
        })
        .catch(err => console.error(err));
    });
  }

  // ----- Group Chat & Creation (Group Page) -----
  const createGroupBtn = document.getElementById('create-group-btn');
  if(createGroupBtn) {
    createGroupBtn.addEventListener('click', () => {
      const groupName = prompt("Enter group name:");
      if(groupName) {
        socket.emit('create group', { groupName });
      }
    });
  }

  socket.on('new group', (group) => {
    const groupList = document.getElementById('group-list');
    if(groupList) {
      const groupDiv = document.createElement('div');
      groupDiv.classList.add('group-item');
      groupDiv.textContent = group.groupName;
      groupDiv.dataset.groupId = group.id;
      groupDiv.addEventListener('click', () => {
        // Open the group chat section and set current group id
        document.getElementById('group-chat').style.display = 'block';
        window.currentGroupId = group.id;
      });
      groupList.appendChild(groupDiv);
    }
  });

  const sendGroupChatBtn = document.getElementById('send-group-chat-btn');
  if(sendGroupChatBtn) {
    sendGroupChatBtn.addEventListener('click', () => {
      const groupChatInput = document.getElementById('group-chat-input');
      const message = groupChatInput.value;
      const username = window.loggedInUser;
      const groupId = window.currentGroupId;
      if(groupId && message.trim() !== "") {
        socket.emit('group message', { groupId, username, message });
      } else if(!groupId) {
        alert("Please select a group first.");
      }
      groupChatInput.value = '';
    });
  }

  socket.on('group message', (data) => {
    appendMessage('group-chat-box', data.username, data.message);
  });

  // ----- Helper Function to Append Messages -----
  function appendMessage(boxId, sender, message) {
    const box = document.getElementById(boxId);
    if(box) {
      const div = document.createElement('div');
      div.classList.add('message');
      div.textContent = `${sender}: ${message}`;
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    }
  }
});
