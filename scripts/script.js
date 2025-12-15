
let letterheadImage = "";
let currentFormat = {
  bold: false,
  italic: false,
  underline: false
};
let isSidebarCollapsed = false;

let savedRange = null;

function saveSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    savedRange = sel.getRangeAt(0);
  }
}

function restoreSelection() {
  if (savedRange) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }
}

document.addEventListener("selectionchange", saveSelection);


/* TOGGLE SIDEBAR */
function toggleSidebar() {
  if (window.innerWidth <= 992) {
    // Mobile behavior
    document.body.classList.toggle('sidebar-mobile-open');
  } else {
    // Desktop behavior
    isSidebarCollapsed = !isSidebarCollapsed;
    document.body.classList.toggle('sidebar-collapsed', isSidebarCollapsed);
    
    // Update toggle icon
    const toggleIcon = document.querySelector('.sidebar-toggle i');
    toggleIcon.className = isSidebarCollapsed ? 'fas fa-bars' : 'fas fa-times';
  }
}

// Close sidebar on mobile when clicking outside
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 992 && 
      document.body.classList.contains('sidebar-mobile-open') &&
      !e.target.closest('.sidebar-nav') &&
      !e.target.closest('.sidebar-toggle')) {
    document.body.classList.remove('sidebar-mobile-open');
  }
});

// Update toggle button visibility on resize
window.addEventListener('resize', () => {
  const toggleBtn = document.querySelector('.sidebar-toggle');
  if (window.innerWidth > 992) {
    toggleBtn.style.display = 'flex';
    document.body.classList.remove('sidebar-mobile-open');
  } else {
    toggleBtn.style.display = 'flex';
    document.body.classList.remove('sidebar-collapsed');
    isSidebarCollapsed = false;
  }
});

/* LOAD PDF AND CONVERT TO IMAGE */
async function loadPDF(input) {
  const file = input.files[0];
  if (!file) return;

  // Show loading state
  const uploadBtn = document.querySelector('.file-upload-button');
  const originalText = uploadBtn.innerHTML;
  uploadBtn.innerHTML = `
    <i class="fas fa-spinner fa-spin"></i>
    <span>Processing...</span>
  `;
  uploadBtn.disabled = true;

  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    letterheadImage = canvas.toDataURL("image/png");
    applyLetterhead(letterheadImage);
    
    // Show success state briefly
    uploadBtn.innerHTML = `
      <i class="fas fa-check" style="color: #10b981"></i>
      <span>Uploaded!</span>
    `;
    
    setTimeout(() => {
      uploadBtn.innerHTML = originalText;
      uploadBtn.disabled = false;
    }, 1500);
    
  } catch (error) {
    console.error("Error loading PDF:", error);
    uploadBtn.innerHTML = `
      <i class="fas fa-times" style="color: #ef4444"></i>
      <span>Upload Failed</span>
    `;
    
    setTimeout(() => {
      uploadBtn.innerHTML = originalText;
      uploadBtn.disabled = false;
    }, 2000);
  }
}

/* APPLY LETTERHEAD TO ALL PAGES */
function applyLetterhead(img) {
  document.querySelectorAll(".page").forEach(p => {
    p.style.backgroundImage = `url(${img})`;
  });
}

/* SET SAFE ZONE MARGINS */
function setMargin(type, value) {
  document.documentElement.style.setProperty(`--safe-${type}`, value + "mm");
  
  // Highlight the changed input briefly
  const input = document.getElementById(type + 'Margin');
  input.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
  setTimeout(() => {
    input.style.backgroundColor = '';
  }, 500);
}

function applyStyleToSelection(styleObj) {
  restoreSelection();

  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  const span = document.createElement("span");

  Object.assign(span.style, styleObj);

  range.surroundContents(span);
  selection.removeAllRanges();
}


/* TEXT FORMATTING FUNCTIONS */
function formatText(command, value) {
  restoreSelection();

  if (command === "fontFamily") {
    document.execCommand("fontName", false, value);
    return;
  }

  if (command === "color") {
    document.execCommand("foreColor", false, value);
    return;
  }

  if (command === "fontSize") {
    applyStyleToSelection({ fontSize: value + "px" });
    return;
  }

  if (command === "fontWeight") {
    applyStyleToSelection({ fontWeight: value });
    return;
  }
}


function toggleFormat(type) {
  restoreSelection();

  const map = {
    bold: "bold",
    italic: "italic",
    underline: "underline"
  };

  document.execCommand(map[type], false, null);
  updateFormatButtons();
}


function clearFormatting() {
  document.execCommand('removeFormat', false, null);
  document.execCommand('styleWithCSS', false, false);
  
  // Reset all format buttons
  Object.keys(currentFormat).forEach(key => {
    currentFormat[key] = false;
    const button = document.getElementById(key + 'Btn');
    if (button) button.classList.remove('active');
  });
  
  // Reset input values
  document.getElementById('fontSize').value = 14;
  document.getElementById('fontFamily').value = 'Arial, sans-serif';
  document.getElementById('fontWeight').value = 'normal';
  document.getElementById('textColor').value = '#000000';
}

function updateFormatButtons() {
  // Check current selection and update button states
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const parentElement = range.commonAncestorContainer.parentElement;
    
    // Check for bold
    const isBold = document.queryCommandState('bold');
    currentFormat.bold = isBold;
    document.getElementById('boldBtn').classList.toggle('active', isBold);
    
    // Check for italic
    const isItalic = document.queryCommandState('italic');
    currentFormat.italic = isItalic;
    document.getElementById('italicBtn').classList.toggle('active', isItalic);
    
    // Check for underline
    const isUnderline = document.queryCommandState('underline');
    currentFormat.underline = isUnderline;
    document.getElementById('underlineBtn').classList.toggle('active', isUnderline);
    
    // Try to get font size and family from selection
if (parentElement) {
  const cs = window.getComputedStyle(parentElement);

  document.getElementById("fontSize").value = parseInt(cs.fontSize) || 14;
  document.getElementById("fontWeight").value = cs.fontWeight;
  document.getElementById("textColor").value = rgbToHex(cs.color);

  const fontSelect = document.getElementById("fontFamily");
  for (let opt of fontSelect.options) {
    if (cs.fontFamily.includes(opt.value.replace(/['"]/g, ""))) {
      fontSelect.value = opt.value;
      break;
    }
  }
}

  }
}

// Helper function to convert RGB to HEX
function rgbToHex(rgb) {
  if (rgb.startsWith('#')) return rgb;
  
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
  if (!match) return '#000000';
  
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  
  return `#${r}${g}${b}`;
}

// Listen for text selection changes
document.addEventListener('selectionchange', updateFormatButtons);

// Initialize format buttons
document.addEventListener('DOMContentLoaded', function() {
  const editable = document.getElementById('editableContent');
  editable.addEventListener('input', updateFormatButtons);
  editable.addEventListener('mouseup', updateFormatButtons);
  editable.addEventListener('keyup', updateFormatButtons);
});

/* ADD NEW PAGE */
function addPage() {
  const doc = document.getElementById("document");
  const first = document.querySelector(".page");
  const clone = first.cloneNode(true);

  if (letterheadImage) {
    clone.style.backgroundImage = `url(${letterheadImage})`;
  }

  doc.appendChild(clone);
  
  // Scroll to new page
  clone.scrollIntoView({ behavior: 'smooth' });
}

/* SAVE DEFAULT SETTINGS */
function saveDefaults() {
  const styles = getComputedStyle(document.documentElement);

  const defaults = {
    image: letterheadImage,
    top: styles.getPropertyValue("--safe-top"),
    bottom: styles.getPropertyValue("--safe-bottom"),
    left: styles.getPropertyValue("--safe-left"),
    right: styles.getPropertyValue("--safe-right"),
    fontFamily: document.getElementById('fontFamily').value,
    fontSize: document.getElementById('fontSize').value,
    fontWeight: document.getElementById('fontWeight').value,
    textColor: document.getElementById('textColor').value
  };

  localStorage.setItem("letterheadDefaults", JSON.stringify(defaults));
  
  // Show visual feedback
  const saveBtn = document.querySelector('.action-button:nth-child(2)');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = `
    <i class="fas fa-check" style="color: #10b981"></i>
    <span>Settings Saved!</span>
  `;
  
  setTimeout(() => {
    saveBtn.innerHTML = originalText;
  }, 1500);
}

/* LOAD DEFAULT SETTINGS */
function loadDefaults() {
  const saved = localStorage.getItem("letterheadDefaults");
  if (!saved) return;

  const d = JSON.parse(saved);

  letterheadImage = d.image;
  if (d.image) applyLetterhead(d.image);

  document.documentElement.style.setProperty("--safe-top", d.top);
  document.documentElement.style.setProperty("--safe-bottom", d.bottom);
  document.documentElement.style.setProperty("--safe-left", d.left);
  document.documentElement.style.setProperty("--safe-right", d.right);
  
  // Set input values
  document.getElementById('topMargin').value = parseInt(d.top);
  document.getElementById('bottomMargin').value = parseInt(d.bottom);
  document.getElementById('leftMargin').value = parseInt(d.left);
  document.getElementById('rightMargin').value = parseInt(d.right);
  
  // Set text formatting values
  if (d.fontFamily) {
    document.getElementById('fontFamily').value = d.fontFamily;
    document.execCommand('fontFamily', false, d.fontFamily);
  }
  if (d.fontSize) {
    document.getElementById('fontSize').value = d.fontSize;
    document.execCommand('fontSize', false, d.fontSize + 'px');
  }
  if (d.fontWeight) {
    document.getElementById('fontWeight').value = d.fontWeight;
    document.execCommand('fontWeight', false, d.fontWeight);
  }
  if (d.textColor) {
    document.getElementById('textColor').value = d.textColor;
    document.execCommand('foreColor', false, d.textColor);
  }
}

// Initialize toggle button visibility
window.addEventListener('load', () => {
  if (window.innerWidth <= 992) {
    document.querySelector('.sidebar-toggle').style.display = 'flex';
  }
});

window.onload = loadDefaults;
