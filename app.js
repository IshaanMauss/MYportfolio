document.addEventListener('DOMContentLoaded', function() {

    // Main portfolio page logic
    if (document.getElementById('projects-grid')) {
        loadProjects();
    }

    // 'add-project' page logic
    if (document.getElementById('project-form')) {
        handleForm();
        setupLivePreview();
    }
});

// --- Main Portfolio Page Logic ---

async function loadProjects() {
    try {
        const response = await fetch('database.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const projects = await response.json();
        const projectsGrid = document.getElementById('projects-grid');
        
        projectsGrid.innerHTML = ''; 

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card reveal';
            
            let videoPlayer = '';
            if (project.videoUrl) {
                videoPlayer = `
                    <div class="video-container">
                        <video controls preload="metadata" playsinline>
                            <source src="${project.videoUrl}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="card-header">
                    <i class="fas fa-folder"></i>
                    <div class="card-links">
                        <a href="${project.githubUrl}" target="_blank" aria-label="GitHub Code"><i class="fab fa-github"></i></a>
                        ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" aria-label="Live Demo"><i class="fas fa-external-link-alt"></i></a>` : ''}
                    </div>
                </div>
                ${videoPlayer}
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <footer>
                    ${project.tags.map(tag => `<span>${tag}</span>`).join('')}
                </footer>
            `;
            projectsGrid.appendChild(card);
        });
        
        initializeScrollAnimations();

    } catch (error) {
        console.error("Could not load projects:", error);
        document.getElementById('projects-grid').innerHTML = '<p class="error-message">Could not load projects. Please check the console for details.</p>';
    }
}

function initializeScrollAnimations() {
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach((element, index) => {
        element.style.transitionDelay = `${index * 100}ms`;
        revealObserver.observe(element);
    });
}

// --- Add Project Page Logic ---

async function fetchReadmeAndParseTags(user, repo) {
    try {
        const response = await fetch(`https://api.github.com/repos/${user}/${repo}/readme`);
        if (!response.ok) return null;

        const readmeData = await response.json();
        const readmeContent = atob(readmeData.content);

        const techKeywords = /#+\s*(technologies used|tech stack|built with)/i;
        const lines = readmeContent.split('\n');
        let techSectionFound = false;
        let tags = [];

        for (const line of lines) {
            if (techKeywords.test(line)) {
                techSectionFound = true;
                continue;
            }

            if (techSectionFound) {
                const trimmedLine = line.trim();
                // Check if it's a list item and not empty
                if ((trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) && trimmedLine.length > 1) {
                    // Remove the list marker, bold/italic markers, and any links or extra descriptions
                    let tag = trimmedLine
                        .replace(/^[-*]\s*/, '')      // Remove leading bullet point
                        .replace(/\[([^\]]+)\]\([^)]+\)/, '$1') // Handle markdown links
                        .replace(/[`*_]/g, '')         // Remove formatting characters
                        .split(':')[0]                 // Stop at a colon
                        .split('(')[0]                 // Stop at an opening parenthesis
                        .trim();
                    
                    if (tag) tags.push(tag);
                } else if (trimmedLine.startsWith('#') || (trimmedLine === '' && tags.length > 0)) {
                    // Stop if we hit a new heading or an empty line after finding tags
                    break;
                }
            }
        }
        
        return tags.join(', ');

    } catch (error) {
        console.error('Could not fetch or parse README:', error);
        return null;
    }
}


function handleForm() {
    const form = document.getElementById('project-form');
    const fetchBtn = document.getElementById('fetch-github-btn');
    const githubUrlInput = document.getElementById('githubUrl');
    const statusEl = document.getElementById('github-status');
    const copyBtn = document.getElementById('copy-json-btn');
    const clearBtn = document.getElementById('clear-form-btn');

    fetchBtn.addEventListener('click', async () => {
        const url = githubUrlInput.value;
        if (!url) {
            statusEl.textContent = "Please enter a GitHub URL.";
            statusEl.style.color = 'var(--primary-color)';
            return;
        }

        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            statusEl.textContent = "Invalid GitHub URL format.";
            statusEl.style.color = 'var(--primary-color)';
            return;
        }
        
        const [, user, repo] = match;
        statusEl.textContent = "Fetching...";
        statusEl.style.color = 'var(--heading-color)';

        try {
            // Fetch repo details
            const response = await fetch(`https://api.github.com/repos/${user}/${repo}`);
            if (!response.ok) {
                throw new Error('Repo not found or API limit reached.');
            }
            const data = await response.json();
            
            document.getElementById('title').value = data.name.split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            document.getElementById('description').value = data.description || '';
            
            // NEW: Fetch and parse README for tags
            const tags = await fetchReadmeAndParseTags(user, repo);
            if (tags) {
                document.getElementById('tags').value = tags;
            }

            // Trigger input events to update the live preview
            document.getElementById('title').dispatchEvent(new Event('input'));
            document.getElementById('description').dispatchEvent(new Event('input'));
            document.getElementById('tags').dispatchEvent(new Event('input'));

            statusEl.textContent = "Successfully fetched repo info!";
            statusEl.style.color = '#4CAF50';

        } catch (error) {
            console.error("GitHub API Error:", error);
            statusEl.textContent = error.message;
            statusEl.style.color = 'var(--primary-color)';
        }
    });

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const newProject = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            githubUrl: document.getElementById('githubUrl').value,
            liveUrl: document.getElementById('liveUrl').value,
            videoUrl: document.getElementById('videoUrl').value,
            tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        const outputContainer = document.getElementById('output-container');
        const jsonOutput = document.getElementById('json-output');
        
        jsonOutput.value = JSON.stringify([newProject], null, 2); 
        outputContainer.style.display = 'block';
    });
    
    copyBtn.addEventListener('click', () => {
        const jsonOutput = document.getElementById('json-output');
        jsonOutput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy to Clipboard'; }, 2000);
    });

    clearBtn.addEventListener('click', () => {
        form.reset();
        // Reset preview and status messages
        document.getElementById('title').dispatchEvent(new Event('input'));
        statusEl.textContent = '';
        document.getElementById('output-container').style.display = 'none';
    });
}

function setupLivePreview() {
    const previewCard = document.getElementById('live-preview-card');
    const form = document.getElementById('project-form');

    form.addEventListener('input', (e) => {
        const title = document.getElementById('title').value || "Your Project Title";
        const description = document.getElementById('description').value || "Your project description will appear here.";
        const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const videoUrl = document.getElementById('videoUrl').value;
        const videoContainer = previewCard.querySelector('.video-container-preview');
        const videoPlayer = videoContainer.querySelector('video');

        previewCard.querySelector('h3').textContent = title;
        previewCard.querySelector('p').textContent = description;
        previewCard.querySelector('footer').innerHTML = tags.length ? tags.map(tag => `<span>${tag}</span>`).join('') : `<span>Tag1</span><span>Tag2</span>`;

        if (videoUrl) {
            videoPlayer.querySelector('source').setAttribute('src', videoUrl);
            videoPlayer.load();
            videoContainer.style.display = 'block';
        } else {
            videoContainer.style.display = 'none';
        }
    });
}