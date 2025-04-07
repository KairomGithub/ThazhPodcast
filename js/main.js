const SUPABASE_URL = 'https://ktggibsidcedvyyvipyj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Z2dpYnNpZGNlZHZ5eXZpcHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDAzNjc4OCwiZXhwIjoyMDU5NjEyNzg4fQ.VD_NlwRL13MoEtFoaLPbuf1EGS-nDkIUK2A_vE06Qq4';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Trang chủ: Lấy danh sách podcast
async function loadPodcasts() {
  const { data, error } = await supabaseClient
    .from('podcasts')
    .select('*');
  
  if (!error && data) {
    const podcastsContainer = document.getElementById('podcast-list');
    podcastsContainer.innerHTML = data
      .map(podcast => `
        <div class="podcast-card" onclick="window.location.href='player.html?id=${podcast.id}'">
          <img src="${podcast.image_url || 'img/default-cover.jpg'}" alt="${podcast.title}">
          <div class="info">
            <h3>${podcast.title}</h3>
            <p>${podcast.category}</p>
          </div>
        </div>
      `)
      .join('');
  } else {
    console.error('Lỗi khi tải danh sách podcast:', error);
  }
}

// Đăng nhập/Đăng ký
const authForm = document.getElementById('auth-form');
if (authForm) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Cập nhật API mới của Supabase
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      alert('Lỗi đăng nhập: ' + error.message);
    } else {
      window.location.href = 'profile.html';
    }
  });
}

const signupButton = document.getElementById('signup');
if (signupButton) {
  signupButton.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Cập nhật API mới của Supabase
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });
    
    if (error) {
      alert('Lỗi đăng ký: ' + error.message);
    } else {
      alert('Vui lòng kiểm tra email để xác thực tài khoản!');
    }
  });
}

// Đăng nhập Google/GitHub
const googleLoginButton = document.getElementById('google-login');
if (googleLoginButton) {
  googleLoginButton.addEventListener('click', async () => {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/profile.html'
      }
    });
    
    if (error) {
      console.error('Lỗi đăng nhập Google:', error);
    }
  });
}

const githubLoginButton = document.getElementById('github-login');
if (githubLoginButton) {
  githubLoginButton.addEventListener('click', async () => {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/profile.html'
      }
    });
    
    if (error) {
      console.error('Lỗi đăng nhập GitHub:', error);
    }
  });
}

// Trang hồ sơ
async function loadProfile() {
  // Cập nhật API mới của Supabase
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  
  if (userError) {
    console.error('Lỗi lấy thông tin người dùng:', userError);
    window.location.href = 'login.html';
    return;
  }
  
  if (user) {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Lỗi tải thông tin hồ sơ:', error);
      return;
    }
    
    // Điền thông tin vào trang
    document.getElementById('display-name').textContent = data.display_name || user.email;
    document.getElementById('followers').textContent = data.followers || 0;
    document.getElementById('podcasts-count').textContent = data.podcasts_count || 0;
    document.getElementById('chapters-count').textContent = data.chapters_count || 0;
  } else {
    // Nếu chưa đăng nhập, chuyển về trang đăng nhập
    window.location.href = 'login.html';
  }
}

const editProfileButton = document.getElementById('edit-profile');
if (editProfileButton) {
  editProfileButton.addEventListener('click', async () => {
    const displayName = prompt('Nhập tên hiển thị mới:');
    
    if (displayName) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      const { error } = await supabaseClient
        .from('users')
        .update({ display_name: displayName })
        .eq('id', user.id);
      
      if (error) {
        alert('Lỗi cập nhật thông tin: ' + error.message);
      } else {
        loadProfile(); // Tải lại thông tin hồ sơ
        alert('Cập nhật thông tin thành công!');
      }
    }
  });
}

// Trang chủ: Liên kết danh mục
const categoryDivs = document.querySelectorAll('#categories div');
if (categoryDivs.length > 0) {
  categoryDivs.forEach(div => {
    div.addEventListener('click', () => {
      const category = div.textContent;
      window.location.href = `category.html?category=${encodeURIComponent(category)}`;
    });
  });
}

// Trang danh mục: Lấy podcast theo thể loại
async function loadCategory() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  
  if (!category) {
    window.location.href = 'index.html';
    return;
  }
  
  const categoryTitle = document.getElementById('category-title');
  if (categoryTitle) {
    categoryTitle.textContent = category;
  }

  const { data, error } = await supabaseClient
    .from('podcasts')
    .select('*')
    .eq('category', category);
  
  if (error) {
    console.error('Lỗi tải podcast theo danh mục:', error);
    return;
  }
  
  const podcastList = document.getElementById('podcast-list');
  if (podcastList && data) {
    podcastList.innerHTML = data
      .map(podcast => `
        <div class="podcast-card" onclick="window.location.href='player.html?id=${podcast.id}'">
          <img src="${podcast.image_url || 'img/default-cover.jpg'}" alt="${podcast.title}">
          <div class="info">
            <h3>${podcast.title}</h3>
            <p>${podcast.description || 'Không có mô tả'}</p>
          </div>
        </div>
      `)
      .join('');
  }
}

// Trang nghe podcast
async function loadPlayer() {
  const urlParams = new URLSearchParams(window.location.search);
  const podcastId = urlParams.get('id');
  
  if (!podcastId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    // Lấy thông tin podcast
    const { data: podcast, error: podcastError } = await supabaseClient
      .from('podcasts')
      .select('title, user_id, category, description')
      .eq('id', podcastId)
      .single();
    
    if (podcastError) throw podcastError;

    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('display_name')
      .eq('id', podcast.user_id)
      .single();
    
    if (userError) throw userError;

    const { data: media, error: mediaError } = await supabaseClient
      .from('media')
      .select('url, type')
      .eq('podcast_id', podcastId);
    
    if (mediaError) throw mediaError;

    // Tìm URL audio và hình ảnh
    const audioUrl = media.find(m => m.type === 'audio')?.url;
    const imageUrl = media.find(m => m.type === 'image')?.url || 'img/default-cover.jpg';

    // Cập nhật thông tin podcast trên giao diện
    document.getElementById('podcast-title').textContent = podcast.title;
    document.getElementById('podcast-author').textContent = user.display_name;
    document.getElementById('podcast-image').src = imageUrl;
    
    // Khởi tạo trình phát audio
    const audio = document.getElementById('audio-player');
    audio.src = audioUrl;

    // Lấy danh sách chapter (nếu có)
    const { data: chapters, error: chaptersError } = await supabaseClient
      .from('chapters')
      .select('id, title, start_time')
      .eq('podcast_id', podcastId)
      .order('start_time', { ascending: true });
    
    // Thiết lập điều khiển phát
    setupPlayerControls(audio, chapters || []);
    
  } catch (error) {
    console.error('Lỗi tải thông tin podcast:', error);
    alert('Không thể tải thông tin podcast. Vui lòng thử lại sau.');
  }
}

// Thiết lập điều khiển trình phát
function setupPlayerControls(audio, chapters) {
  const playPauseBtn = document.getElementById('play-pause');
  const progress = document.getElementById('progress');
  const timeDisplay = document.getElementById('time');
  const rewindBtn = document.getElementById('rewind');
  const forwardBtn = document.getElementById('forward');
  
  // Nút phát/tạm dừng
  playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playPauseBtn.textContent = '⏸️';
    } else {
      audio.pause();
      playPauseBtn.textContent = '▶️';
    }
  });

  // Nút tua nhanh/lùi
  rewindBtn.addEventListener('click', () => {
    audio.currentTime -= 10;
  });
  
  forwardBtn.addEventListener('click', () => {
    audio.currentTime += 10;
  });

  // Cập nhật thời gian và thanh tiến trình
  audio.addEventListener('timeupdate', () => {
    const current = formatTime(audio.currentTime);
    const duration = formatTime(audio.duration);
    timeDisplay.textContent = `${current} / ${duration}`;
    progress.value = (audio.currentTime / audio.duration) * 100 || 0;
    
    // Cập nhật chapter hiện tại
    updateCurrentChapter(audio.currentTime, chapters);
  });

  // Khi tương tác với thanh tiến trình
  progress.addEventListener('input', () => {
    audio.currentTime = (progress.value / 100) * audio.duration;
  });

  // Hiển thị danh sách chapter
  const chaptersContainer = document.getElementById('chapters');
  if (chapters.length > 0) {
    chaptersContainer.innerHTML = chapters
      .map(chapter => `
        <li data-start="${chapter.start_time}" id="chapter-${chapter.id}">
          ${chapter.title} (${formatTime(chapter.start_time)})
        </li>
      `)
      .join('');
    
    // Thêm sự kiện click cho mỗi chapter
    document.querySelectorAll('#chapters li').forEach(item => {
      item.addEventListener('click', () => {
        const startTime = parseFloat(item.getAttribute('data-start'));
        audio.currentTime = startTime;
        audio.play();
        playPauseBtn.textContent = '⏸️';
      });
    });
  } else {
    chaptersContainer.innerHTML = '<li>Không có chapter</li>';
  }
}

// Cập nhật chapter hiện tại
function updateCurrentChapter(currentTime, chapters) {
  if (chapters.length === 0) return;
  
  // Tìm chapter hiện tại
  let currentChapter = chapters[0];
  for (let i = 0; i < chapters.length; i++) {
    if (i === chapters.length - 1) {
      currentChapter = chapters[i];
      break;
    }
    
    if (currentTime >= chapters[i].start_time && currentTime < chapters[i+1].start_time) {
      currentChapter = chapters[i];
      break;
    }
  }
  
  // Đánh dấu chapter hiện tại trong danh sách
  document.querySelectorAll('#chapters li').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeChapter = document.getElementById(`chapter-${currentChapter.id}`);
  if (activeChapter) {
    activeChapter.classList.add('active');
    // Cuộn đến chapter đang phát
    activeChapter.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Định dạng thời gian hiển thị
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

// Kiểm tra trạng thái đăng nhập và hiển thị menu phù hợp
async function checkAuthState() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const navLinks = document.querySelector('nav');
  
  if (navLinks) {
    if (user) {
      // Nếu đã đăng nhập, hiển thị liên kết hồ sơ và ẩn đăng nhập
      const loginLink = navLinks.querySelector('a[href="login.html"]');
      if (loginLink) {
        loginLink.style.display = 'none';
      }
    } else {
      // Nếu chưa đăng nhập, ẩn liên kết hồ sơ
      const profileLink = navLinks.querySelector('a[href="profile.html"]');
      if (profileLink) {
        profileLink.style.display = 'none';
      }
    }
  }
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', async () => {
  // Kiểm tra trạng thái đăng nhập trên mọi trang
  await checkAuthState();
  
  // Xác định trang hiện tại và tải nội dung phù hợp
  const currentPath = window.location.pathname;
  
  if (currentPath.includes('index.html') || currentPath.endsWith('/')) {
    loadPodcasts();
  } else if (currentPath.includes('category.html')) {
    loadCategory();
  } else if (currentPath.includes('profile.html')) {
    loadProfile();
  } else if (currentPath.includes('player.html')) {
    loadPlayer();
  }
});
