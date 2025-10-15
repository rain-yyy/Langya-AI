<script>
    // v3: hide async option and set as default when storeid is data-entry-test
    // v3: to fix onedrive folder picker

  //# variables init
  //v15
  let useOrNot = false;
  let CUSTOMER_ID = null;
  let attachedFiles = [];
  //v7
  //20250904: update + storage change
  //let storageMode = null;
  let storageMode = 'none';

  let sourceMode = null;
  let StorageModeSelector = null;
  let SourceModeSelector = null; 
  let directoryHandle = null;
  let lcdirectoryHandle = null;
  //v5
  let messagesDiv = null;
  let tokensDisplay = null;
  let creditAccountSelector = null;
  let botSelector = null;
  let userInput = '';
  let roomList = [];
  let saveStatus = null;
  let editSaveDirBtn = null;
  let sendButton = null;
  let createRoomBtn = null;
  let dbChooseFolderBtn = null;
  let botsList = [];
  let isDropboxLinked = false;

  let thinkingInterval = null;
  let thinkingMessageDiv = null;
  //v5
  let chatHistory = [];
  let userHistory = [];
  let limitedHistory = [];
  let limitedUserHistory = [];
  //v6
  let currentRoomId = null;
  let currentRoom = null;
  //v7
  const storageModes = {
  //20250904: update + storage change
    {% comment %} none: 'None',
    local: 'Local Storage' {% endcomment %}
    none: 'Not Storing History',
    local: 'Local Storage'

  };
  // Hide premium local
  const sourceModes = {
    premium: 'Premium Dropbox',
    premiumd: 'Premium Drive',
    premiumod: 'Premium OneDrive'
  };
  // v20250816: move storeid out from fetching
  const storeId = 'data-entry-test';

  // Maps corresponding storage modes to their numerical representation
  const mapper = {
    'premiuml' : 1,
    'premium' : 2,
    'premiumd' : 3,
    'premiumod' : 4
  }
  const langya_secret_key = "{{ settings.langya_secret_key }}";
  // v20250816: use gdrivepicker
  // const GOOGLE_CLIENT_ID = "{{settings.GOOGLE_CLIENT_ID}}"; 
  //const GOOGLE_API_KEY = "{{settings.GOOGLE_API_KEY}}";
  const email = "{{ customer.email }}";
  console.log(`Email: ${email}`);
  //v5
  let currentBot = null;
  let botsCategories = [];

  //v18
  let creditAccounts = [];
  let currentCreditAccount = null;

  //v20
  let currencies = {};

  //v21
  let folderPopup = null;
  let closePopupBtn = null;
  let useFolderBtn = null;
  let cancelFolderBtn = null;
  let folderStats = null;
  let viewFolderBtn = null;
  let inputFolder = null;
  let outputFolder = null;

  let selectedFolderPath = null;
  let selectedFolderId = null;
  let googlePickerInitialized = false;
  let folderName = null;
  let folderId = null;
  let OutputFolderId = null;
  let outputfolderName = null;
  let asyncMode = false;
  let DataEntry = 0;

  const ONEDRIVE_REDIRECT_URI = window.location.origin + window.location.pathname;
  //----------- Helper functions -----------:
  function addRoomLatestTime(timestamp, li) {
    if (timestamp) {
      const dateObj = new Date(timestamp);
      const dateStr = formatDateYYYYMMDD(dateObj);
      const timeStr = dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const dateSpan = document.createElement('span');
      dateSpan.style.float = 'right';
      dateSpan.style.color = '#888';
      dateSpan.style.fontSize = '0.95em';
      dateSpan.textContent = `${dateStr}, ${timeStr}`;
      li.appendChild(dateSpan);
    }
  }

  //----------- display related -----------:

  //# Add message (v1)
  async function addMessage(
    content,
    isUser = false,
    timestamp = null,
    model,
    isImage = false,
    skipHistory = false,
    files = []
  ) {
    const message = document.createElement('div');
    message.classList.add('chatbot-message', isUser ? 'user' : 'bot');
    let innerHTML = null;
    if (!isUser && !isImage) {
      innerHTML = await getHTMLformat(content);
    }
    stopBotThinking();

    files = files || [];

    if (files.length > 0 && isUser) {
      const attachmentDiv = document.createElement('div');
      attachmentDiv.classList.add('chatbot-attachment');
      attachmentDiv.style.display = 'flex';
      attachmentDiv.style.flexWrap = 'wrap';
      attachmentDiv.style.gap = '10px';

      const promises = [];

      for (const file of files) {
        if (file.type.startsWith('image/')) {
          promises.push(renderImageMessage(attachmentDiv, file));
        } else {
          const iconSpan = document.createElement('span');
          iconSpan.textContent = getFileIcon(file.type);
          iconSpan.classList.add('chatbot-file-icon');
          const nameSpan = document.createElement('span');
          nameSpan.textContent = file.name || '';
          const fileDiv = document.createElement('div');
          fileDiv.appendChild(iconSpan);
          fileDiv.appendChild(nameSpan);
          attachmentDiv.appendChild(fileDiv);
        }
      }

      await Promise.all(promises);

      const textDiv = document.createElement('div');
      // Use htmlFormat if provided, else fall back to content as plain text

      if (!isUser) {
        textDiv.innerHTML = innerHTML;
      } else {
        textDiv.innerHTML = content;
      }

      textDiv.style.marginTop = '6px';
      message.appendChild(attachmentDiv);
      message.appendChild(textDiv);

      if (timestamp) {
        const date = new Date(timestamp);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const dateString = formatDateYYYYMMDD(date);
        let info = `${timeString}, ${dateString}`;
        if (model) info += `, ${model}`;
        const timeDiv = document.createElement('div');
        timeDiv.classList.add('chatbot-message-time');
        timeDiv.textContent = info;
        message.appendChild(timeDiv);
      }

      messagesDiv.appendChild(message);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      if (!skipHistory) userHistory.push(content);
    } else {
      if (!isImage) {
        if (!isUser) {
          message.innerHTML = innerHTML;
        } else {
          message.innerHTML = content;
        }
      }

      const isErrorMsg = typeof content === 'string' && content.trim().startsWith('Sorry, an error occurred');

      if (isImage && !isUser && !isErrorMsg) {
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${content}`;
        img.alt = 'Generated image';
        img.classList.add('chatbot-image');
        img.style.maxWidth = '100%';
        img.style.marginTop = '10px';
        message.appendChild(img);
      } else if (isImage) {
        message.textContent = 'Image generation failed. Please try again.';
      }

      if (timestamp) {
        const date = new Date(timestamp);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const dateString = formatDateYYYYMMDD(date);
        let info = `${timeString}, ${dateString}`;
        if (model) info += `, ${model}`;
        const timeDiv = document.createElement('div');
        timeDiv.classList.add('chatbot-message-time');
        timeDiv.textContent = info;
        message.appendChild(timeDiv);
      }

      messagesDiv.appendChild(message);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      if (!isImage && !skipHistory) {
        if (!isUser) chatHistory.push(content);
        else userHistory.push(content);
      }
    }
  }

  //v14
  function renderImageMessage(attachmentDiv, file) {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const reader = new FileReader();
      reader.onload = function (e) {
        img.src = e.target.result;
        img.alt = 'Attached image';
        img.classList.add('chatbot-attached-image');
        img.style.maxWidth = '30%';
        img.style.marginBottom = '10px';
        attachmentDiv.appendChild(img);
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function reorderRoomList(currentRoomId) {
    const roomList = document.getElementById('room-list');
    const roomItems = Array.from(roomList.getElementsByClassName('room-item'));

    const currentRoomItem = roomItems.find((item) => item.getAttribute('data-room-id') === currentRoomId);
    if (!currentRoomItem) return;

    roomItems.forEach((item) => item.classList.remove('active'));

    // Preserve structure by re-adding name and delete button if needed
    const roomName = currentRoomItem.getAttribute('data-room-name');
    const nameSpan = currentRoomItem.querySelector('span') || document.createElement('span');
    if (!nameSpan.parentNode) {
      nameSpan.textContent = roomName;
      currentRoomItem.insertBefore(nameSpan, currentRoomItem.firstChild);
    }
    const deleteButton = currentRoomItem.querySelector('.delete-room-btn') || document.createElement('button');
    if (!deleteButton.parentNode) {
      deleteButton.textContent = '×';
      deleteButton.classList.add('delete-room-btn');
      deleteButton.setAttribute('data-room-id', currentRoomId);
      deleteButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteRoom(currentRoomId);
      });
      currentRoomItem.appendChild(deleteButton);
    }

    roomList.prepend(currentRoomItem);
    currentRoomItem.classList.add('active');
  }

  function updateTimeOfChatRoom() {
    let now = new Date().toISOString();
    const roomItem = document.querySelector(`.room-item[data-room-id="${currentRoomId}"]`);
    if (roomItem) {
      // Remove only the timestamp span, not the name or delete button
      const oldSpan = roomItem.querySelector('span[style*="float: right"]');
      if (oldSpan) oldSpan.remove();
      addRoomLatestTime(now, roomItem);
    }
  }

  function updateEditSaveDirBtnVisibility() {
    if (directoryHandle) {
      editSaveDirBtn.style.display = 'inline-block';
    } else {
      editSaveDirBtn.style.display = 'none';
    }
  }

  //# Bots selector dropdown menu (v5)
  function populateBotSelector() {
    botSelector.innerHTML = '';
    const categories = {};

    // Add default option
    let defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Please select a bot';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    botSelector.appendChild(defaultOption);

    botsCategories.forEach((c) => {
      category = c['page-list'];
      categories[category] = [];
      botsList.forEach((bot) => {
        if (bot[category] == 1) {
          categories[category].push(bot);
        }
      });
    });

    for (const category in categories) {
      const group = document.createElement('optgroup');
      group.label = category;

      categories[category].forEach((bot) => {
        const option = document.createElement('option');
        option.value = bot.name;
        const rates = currencies;
        const currencyChosen = currentCreditAccount.balance.currencyCode;
        const customerCurrencyRate = rates[currencyChosen];
        const botCurrencyRate = rates[bot.currency];
        const deduction = (bot.cost / (botCurrencyRate || 1)) * (customerCurrencyRate || 1);
        option.textContent = `${bot.name} (min: ${customRound(deduction, 3)} ${currencyChosen})`;

        if (currentBot && bot.id === currentBot.id) {
          option.selected = true;
        }

        group.appendChild(option);
      });
      botSelector.appendChild(group);
    }
  }

  //#  Storage selector dropdown menu (v7)
  //20250904: update + storage change
  {% comment %} function populateStorageSelectorMenu() {
    StorageModeSelector.innerHTML = '';
    let defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select storage mode';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    StorageModeSelector.appendChild(defaultOption);

    for (const key in storageModes) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = storageModes[key];
      StorageModeSelector.appendChild(option);
    }
  } {% endcomment %}
    function populateStorageSelectorMenuv2() {
    // Clear the existing options
    StorageModeSelector.innerHTML = ''; 
    // Add the 'none' option first and set it as selected
    const noneOption = document.createElement('option');
    noneOption.value = 'none';
    noneOption.textContent = storageModes.none;
    noneOption.selected = true; // Set 'none' as the default selected option
    StorageModeSelector.appendChild(noneOption);
    // Add the other storage modes
    for (const key in storageModes) {
        if (key !== 'none') { // Skip the 'none' option as it's already added
        const option = document.createElement('option');
        option.value = key;
        option.textContent = storageModes[key];
        StorageModeSelector.appendChild(option);
        }
    }
    }


  function populateSourceSelectorMenu() {
    SourceModeSelector.innerHTML = '';
    let defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select source mode';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    SourceModeSelector.appendChild(defaultOption);

    for (const key in sourceModes) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = sourceModes[key];
      SourceModeSelector.appendChild(option);
    }
  }

  function populateCreditAccountSelector() {
    creditAccountSelector.innerHTML = '';
    creditAccounts.forEach((account, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${account.balance.currencyCode}`;
      creditAccountSelector.appendChild(option);
    });
    if (creditAccounts.length > 0) {
      creditAccountSelector.value = 0;
    }
  }

  //#Start and stop thinking animation:
  //v5
  function startBotThinking() {
    const dots = ['.\u00A0\u00A0', '..\u00A0', '...'];
    let i = 0;

    stopBotThinking();

    thinkingMessageDiv = document.createElement('div');
    thinkingMessageDiv.classList.add('chatbot-message', 'bot');
    thinkingMessageDiv.textContent = dots[0];
    messagesDiv.appendChild(thinkingMessageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    thinkingInterval = setInterval(() => {
      i = (i + 1) % dots.length;
      thinkingMessageDiv.textContent = dots[i];
    }, 500);
  }

  //v5
  function stopBotThinking() {
    if (thinkingInterval) {
      clearInterval(thinkingInterval);
      thinkingInterval = null;
    }
    if (thinkingMessageDiv) {
      messagesDiv.removeChild(thinkingMessageDiv);
      thinkingMessageDiv = null;
    }
  }
  
  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  document.addEventListener('DOMContentLoaded', function () {
    //----------- Initial setup -----------:
    
    //# HTML elements control
    //v1
    CUSTOMER_ID = document.getElementById('shopify-customer').getAttribute('data-customer-id');
    userInput = document.querySelector('.chatbot-input-field');
    sendButton = document.querySelector('.chatbot-send');
    tokensDisplay = document.getElementById('customer-tokens');
    messagesDiv = document.querySelector('.chatbot-messages');
    //v3
    roomList = document.getElementById('room-list');
    createRoomBtn = document.getElementById('create-room');
    //v5
    botSelector = document.getElementById('bot-selector');
    //v7
    saveStatus = document.getElementById('save-status');
    editSaveDirBtn = document.getElementById('edit-save-dir-btn');
    StorageModeSelector = document.getElementById('storage-mode-selector');
    SourceModeSelector = document.getElementById('source-mode-selector');
    //v11
    lcChooseFolderBtn = document.getElementById('choose-local-input');
    lcChooseOutputBtn = document.getElementById('choose-local-output');
    dbChooseFolderBtn = document.getElementById('choose-folder');
    dbChooseOutputBtn = document.getElementById('choose-db-output');
    gdChooseFolderBtn = document.getElementById('choose-gdrive');
    gdChooseOutputBtn = document.getElementById('choose-output');
    odChooseFolderBtn = document.getElementById('choose-od-input');
    odChooseOutputBtn = document.getElementById('choose-od-output');
    //v15
    attachBtn = document.getElementById('attach-button');
    fileInput = document.createElement('input');
    //v16
    selectedFileName = document.getElementById('selected-file-name');
    //v18
    creditAccountSelector = document.getElementById('credit-account-selector');

    const snackbar = document.getElementById('snackbar');
    const snackbarMessage = document.getElementById('snackbar-message');
    const snackbarClose = document.getElementById('snackbar-close');

    folderPopup = document.getElementById('folder-popup');
    closePopupBtn = document.querySelector('.close-popup');
    useFolderBtn = document.getElementById('use-folder');
    cancelFolderBtn = document.getElementById('cancel-folder');
    folderStatsDiv = document.getElementById('folder-stats');
    viewFolderBtn = document.getElementById('view-folder-btn');
    inputFolder = document.getElementById('input-folder');
    outputFolder = document.getElementById('output-folder');

    // Hide premium version buttons initially
    lcChooseFolderBtn.style.display = 'none';
    lcChooseOutputBtn.style.display = 'none';
    dbChooseFolderBtn.style.display = 'none';
    dbChooseOutputBtn.style.display = 'none';
    gdChooseFolderBtn.style.display = 'none';
    gdChooseOutputBtn.style.display = 'none';
    odChooseFolderBtn.style.display = 'none';
    odChooseOutputBtn.style.display = 'none';

    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    console.log('CUSTOMER_ID: ', CUSTOMER_ID);
    sendLogToBackend(`CUSTOMER_ID: ${CUSTOMER_ID}`);



    //# Initial functions run
    //v1
    async function fetchCreditAccounts() {
      await fetchTokens();
      populateCreditAccountSelector();
    }

    fetchCreditAccounts();
    //v3
    fetchRooms();
    //v7
    //20250904: update + storage change
    {% comment %} populateStorageSelectorMenu(); {% endcomment %}
    populateStorageSelectorMenuv2();

    populateSourceSelectorMenu();

    async function getBots() {
      await getCategoriesList();
      let botsList = getBotsData();
      console.log('categoriesList: ', botsCategories);
    }

    getBots();
    if (storeId !== 'data-entry-test') {
        SourceModeSelector.style.display = 'none';
        document.getElementById('async-mode-checkbox').parentElement.style.display = 'none';
    } else {
        SourceModeSelector.style.display = 'block';
        // v3: hide async option and set as default when storeid is data-entry-test
        {% comment %} document.getElementById('async-mode-checkbox').parentElement.style.display = 'block'; {% endcomment %}
        document.getElementById('async-mode-checkbox').parentElement.style.display = 'none';
        asyncMode = true; // <-- ADD THIS LINE

    }
    fetchCurrencies();

    //------------------------------------------------:

    // Main function to delete a room based on storage mode

    //----------- Event listener functions -----------:
    // Generalized snackbar function
    function showSnackbar(message, color) {
      snackbarMessage.innerHTML = message;
      snackbar.style.backgroundColor = color;
      snackbar.style.display = 'block';
      setTimeout(() => {
        snackbar.style.display = 'none';
      }, 4000);
    }

    function toggleAttachButton(hide = true) {
      const attachButton = document.getElementById('attach-button');
      if (hide) {
        attachButton.style.display = 'none';
      } else {
        attachButton.style.display = 'block';
      }
    }

    async function handleStorageModeChange(mode) {
        storageMode = mode;

        // Reset UI elements for storage modes
        attachBtn.style.display = 'none';
        if (sourceMode === null){
            document.getElementById('folder-inputs').style.display = 'none';
            document.getElementById('selected-input-folder').textContent = "";
            document.getElementById('selected-output-folder').textContent = "";
        }

        // Handle basic storage modes
        const storageModeHandlers = {
            'local': async () => {
            if (!directoryHandle) {
                attachBtn.style.display = 'block';
                await selectLocalDir();
            }
            },
            'none': () => {
            if (sourceMode === null){
                attachBtn.style.display = 'block';
            }
            },
        };

        if (storageModeHandlers[storageMode]) {
            await storageModeHandlers[storageMode]();
        }

        // Common operations
        console.log("Fetching rooms...");
        await fetchRooms();
        console.log('Storage mode changed to:', storageMode);
        sendLogToBackend(`Storage mode changed to: ${storageMode}`);
    }

    async function handleSourceModeChange(mode) {
        sourceMode = mode;

        // Reset UI elements for source modes
        dbChooseFolderBtn.style.display = 'none';
        dbChooseOutputBtn.style.display = 'none';
        gdChooseFolderBtn.style.display = 'none';
        gdChooseOutputBtn.style.display = 'none';
        lcChooseFolderBtn.style.display = 'none';
        lcChooseOutputBtn.style.display = 'none';
        odChooseFolderBtn.style.display = 'none';
        odChooseOutputBtn.style.display = 'none';
        attachBtn.style.display = 'none';
        document.getElementById('folder-inputs').style.display = 'none';
        document.getElementById('selected-input-folder').textContent = "";
        document.getElementById('selected-output-folder').textContent = "";

        // Handle premium source modes
        const sourceModeHandlers = {
            'premium': () => {
            dbChooseFolderBtn.style.display = 'block';
            dbChooseOutputBtn.style.display = 'block';
            document.getElementById('folder-inputs').style.display = 'block';
            window.location.href = `https://us-central1-lt-bot-setup-v2.cloudfunctions.net/dropboxapiv4direct_aib_test2/auth/dropbox?customerId=${CUSTOMER_ID}`;
            },
            'premiumd': () => {
            gdChooseFolderBtn.style.display = 'block';
            gdChooseOutputBtn.style.display = 'block';
            document.getElementById('folder-inputs').style.display = 'block';
            const currentUrl = window.location.href;
            // const authUrl = `https://us-central1-lt-bot-setup-v2.cloudfunctions.net/gdriveapiv7direct_aib_test2/auth/google?customerId=${CUSTOMER_ID}&referrer=${encodeURIComponent(currentUrl)}`;
            const authUrl = `https://us-central1-lt-bot-setup-v2.cloudfunctions.net/gdriveapiv7direct_aib_test2/auth/google?customerId=${CUSTOMER_ID}`;
            window.location.href = authUrl;
            },
            'premiuml': () => {
            lcChooseFolderBtn.style.display = 'block';
            lcChooseOutputBtn.style.display = 'block';
            document.getElementById('folder-inputs').style.display = 'block';
            },
            'premiumod': () => {
            odChooseFolderBtn.style.display = 'block';
            odChooseOutputBtn.style.display = 'block';
            document.getElementById('folder-inputs').style.display = 'block';
            window.location.href = `https://us-central1-gdrive-functions.cloudfunctions.net/onedriveapiv1direct/auth/onedrive?customerId=${CUSTOMER_ID}`;
            }
        };

        if (sourceModeHandlers[sourceMode]) {
            await sourceModeHandlers[sourceMode]();
        }

        // Common operations
        console.log("Fetching rooms...");
        await fetchRooms();
        console.log('Source mode changed to:', sourceMode);
        sendLogToBackend(`Source mode changed to: ${sourceMode}`);
    }

    // Event listener for snackbar close button
    snackbarClose.addEventListener('click', function () {
      snackbar.style.display = 'none';
    });

    //# When messages are sent (v1)
    sendButton.addEventListener('click', async function () {
      if (!CUSTOMER_ID || CUSTOMER_ID === 'null' || CUSTOMER_ID === 'undefined' || CUSTOMER_ID === '') {
        showSnackbar('Please login', 'rgb(255, 133, 32)');
        return;
      }
      if (currentBot == null) {
        showSnackbar('Please select a bot', 'rgb(16, 187, 255)');
        return;
      }
      console.log(storageMode, sourceMode);
      //20250904: update + storage change=
      {% comment %} if (storageMode == null) {
        showSnackbar('Please select a storage Mode', 'rgb(0, 167, 44)');
        return;
      } {% endcomment %}

      if (sourceMode == null && Number(DataEntry) === 1){
        showSnackbar('You can also choose one of our source modes for ease', 'rgb(0, 167, 44)');
      }
      let credit = parseFloat(tokensDisplay.textContent);
      const currencyChosen = currentCreditAccount.balance.currencyCode;
      const rates = currencies;
      const customerCurrencyRate = rates[currencyChosen];
      const botCurrencyRate = rates[currentBot.currency];
      const minBotCost = (currentBot.cost / botCurrencyRate) * customerCurrencyRate;
      if (credit < minBotCost) {
        showSnackbar('Not enough credits', 'rgb(255, 100, 100)');
        return;
      }
      const message = userInput.value.trim();
      if (!message) {
        return;
      }

      sendButton.disabled = true;
      sendButton.classList.add('disabled');

      let now = new Date().toISOString();
      let text = userInput.value;

      sendBtnLogic(currentCreditAccount);
    });

    //# When enter button is pressed (send button trigger) (v1)
    userInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        sendButton.click();
      }
    });

    //# Room selection and creation (v3)
    roomList.addEventListener('click', function (e) {
      const roomItem = e.target.closest('.room-item');
      if (roomItem) {
        document.querySelector('.room-item.active').classList.remove('active');
        roomItem.classList.add('active');
        currentRoomId = roomItem.getAttribute('data-room-id');
        currentRoom = roomItem.getAttribute('data-room-name');
        loadChatHistory(currentRoomId);
        // Ensure name and delete button are present
        const roomName = roomItem.getAttribute('data-room-name');
        let nameSpan = roomItem.querySelector('span');
        if (!nameSpan) {
          nameSpan = document.createElement('span');
          nameSpan.textContent = roomName;
          roomItem.insertBefore(nameSpan, roomItem.firstChild);
        }
        let deleteButton = roomItem.querySelector('.delete-room-btn');
        if (!deleteButton) {
          deleteButton = document.createElement('button');
          deleteButton.textContent = '×';
          deleteButton.classList.add('delete-room-btn');
          deleteButton.setAttribute('data-room-id', currentRoomId);
          deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            await deleteRoom(currentRoomId);
          });
          roomItem.appendChild(deleteButton);
        }
      }
    });

    //# Create new room (v3)
    createRoomBtn.addEventListener('click', async function () {
      const roomName = prompt('Enter new room name (e.g., customer ID or custom name):');
      if (!roomName) return;
      const roomId = await getUniqueId();
      currentRoomId = roomId;
      currentRoom = roomName;

      const li = document.createElement('li');
      li.classList.add('room-item');

      const nameSpan = document.createElement('span');
      nameSpan.textContent = roomName;
      li.appendChild(nameSpan);

      const deleteButton = document.createElement('button');
      deleteButton.textContent = '×';
      deleteButton.classList.add('delete-room-btn');
      deleteButton.setAttribute('data-room-id', roomId);
      deleteButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteRoom(roomId);
      });
      li.appendChild(deleteButton);

      li.setAttribute('data-room-id', roomId);
      li.setAttribute('data-room-name', roomName);
      roomList.appendChild(li);
      reorderRoomList(currentRoomId);
      loadChatHistory(currentRoomId);
    });

    botSelector.addEventListener('change', function () {
      
      useOrNot = false;
      viewFolderBtn.disabled = false;
      viewFolderBtn.innerHTML = 'Confirm';
      viewFolderBtn.style.backgroundColor = '#8d0033'; 
      viewFolderBtn.style.cursor = 'pointer';
      const selectedModel = this.value;
      let selectedCategory = null;

      const selectedOption = this.options[this.selectedIndex];
      if (selectedOption) {
        const optGroup = selectedOption.closest('optgroup');
        if (optGroup) {
          selectedCategory = optGroup.label;
        }
      }

      botsList.forEach((bot) => {
        if (bot.name === selectedModel) {
          currentBot = bot;
          currentBot.category = selectedCategory;
        }
      });
     
      category = botsCategories.filter((c) => c['page-list'] == selectedCategory)[0];
      
      if (category['blockFileUploadFlag'] == 1) {
        toggleAttachButton(true);
      } else {
        toggleAttachButton(false);
      }
      if (sourceMode === 'premium' || sourceMode === 'premiumd' || sourceMode === 'premiuml') {
        attachBtn.style.display = 'none';
      } else {
        attachBtn.style.display = 'block';
      }
      console.log(`Selected bot: ${selectedModel}, Category: ${selectedCategory}`);
    });
  
    //# choose storing method (v7)
  // Event listeners for both selectors
    StorageModeSelector.addEventListener('change', async function () {
        //20250904: update + storage change=
        storageMode = this.value; 

        await handleStorageModeChange(this.value);
    });

    SourceModeSelector.addEventListener('change', async function () {
        await handleSourceModeChange(this.value);
    });

    editSaveDirBtn.addEventListener('click', async function () {
      await selectLocalDir();
      fetchRooms();
    });

    dbChooseFolderBtn.addEventListener('click', async function () {
      Dropbox.choose({
        success: async function (files) {
          selectedFolderId = files[0].id;
          selectedFolderPath = files[0].name;
          folderName = selectedFolderPath
          document.getElementById('selected-input-folder').textContent = `Selected Input Folder: ${folderName}`;
          sessionStorage.setItem('selectedDropboxFolder', selectedFolderPath);
          console.log(JSON.stringify(files));
          console.log('selectedFolderPath: ', selectedFolderPath);
          sendLogToBackend(JSON.stringify(files));
          sendLogToBackend(`selectedFolderPath: ${selectedFolderPath}`);
          useOrNot = true;
          await populateInputFolder(selectedFolderId);
        },
        cancel: function () {
          console.log('User canceled folder selection');
          sendLogToBackend('User canceled folder selection');
        },
        multiselect: false,
        folderselect: true,
      });
    });

    dbChooseOutputBtn.addEventListener('click', async function () {
      Dropbox.choose({
        success: async function (files) {
          OutputFolderId = files[0].id;
          const OutputFolderName = files[0].name;
          outputfolderName = OutputFolderName;
          document.getElementById('selected-output-folder').textContent = `Selected Output Folder: ${OutputFolderName}`;
          sessionStorage.setItem('selectedDropboxOutputFolder', OutputFolderId);
          console.log(JSON.stringify(files));
          console.log('OutputFolderId: ', OutputFolderId);
          sendLogToBackend(JSON.stringify(files));
          sendLogToBackend(`OutputFolderId: ${OutputFolderId}`);
          useOrNot = true;
          await populateOutputFolder(OutputFolderId);
        },
        cancel: function () {
          console.log('User canceled folder selection');
          sendLogToBackend('User canceled folder selection');
        },
        multiselect: false,
        folderselect: true,
      });
    });
 
    gdChooseFolderBtn.addEventListener('click', () => {
      showGoogleDriveInputPicker();
    });
    
    gdChooseOutputBtn.addEventListener('click', () => {
      showGoogleDriveOutputPicker();
    });

    // v3: to fix onedrive folder picker
    odChooseFolderBtn.addEventListener('click', async function () {
        await showOneDrivePicker(false);
    });
    odChooseOutputBtn.addEventListener('click', async function () {
        await showOneDrivePicker(true);
    });
    {% comment %} // START Handle OneDrive Picker
    if (odChooseFolderBtn) {
      odChooseFolderBtn.addEventListener('click', function() {
        if (typeof createOdPicker === 'function') {
          createOdPicker();
        } else {
          console.error('OneDrive picker function not loaded.');
        }
      });
    }

    if (odChooseOutputBtn) {
      odChooseOutputBtn.addEventListener('click', function() {
        if (typeof createOdOutputPicker === 'function') {
          createOdOutputPicker();
        } else {
          console.error('OneDrive output picker function not loaded.');
        }
      });
    }
    // END Handle OneDrive Picker {% endcomment %}


    lcChooseFolderBtn.addEventListener('click', async () => {
      try {
        attachedFiles = [];
        lcdirectoryHandle = await window.showDirectoryPicker();
        document.getElementById('selected-input-folder').textContent = `Selected Input Folder: ${lcdirectoryHandle.name}`;
        for await (const entry of lcdirectoryHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            attachedFiles.push(file);
          }
        }
        selectedFolderId = lcdirectoryHandle.name;
        useOrNot = true;
        populateInputFolder(selectedFolderId);
        console.log("Done selecting local directory:", lcdirectoryHandle.name);
      } catch (error) {
        console.error("Error selecting directory:", error);
        document.getElementById('selected-input-folder').textContent = "No folder selected";
      }
    });

    lcChooseOutputBtn.addEventListener('click', async() => {
      try {
        const outputDirectoryHandle = await window.showDirectoryPicker();
        document.getElementById('selected-output-folder').textContent = `Selected Output Folder: ${outputDirectoryHandle.name}`;
        OutputFolderId = outputDirectoryHandle.name;
        outputfolderName = OutputFolderId;
        useOrNot = true;
        await populateOutputFolder(OutputFolderId);
      } catch (error) {
        console.error("Error selecting output directory:", error);
        document.getElementById('selected-output-folder').textContent = "No folder selected";
      }
    })
    //v14
    attachBtn.addEventListener('click', function () {
    if (sourceMode === 'premium') {
        showSnackbar('File attachments disabled in Premium Dropbox mode', 'rgb(255, 100, 100)');
        return; // Exit the function early
    }
    if (sourceMode === 'premiumd'){
      showSnackbar('File attachments disabled in Premium Google Drive mode', 'rgb(255, 100, 100)');
      return;
    }
    if (sourceMode === 'premiuml'){
      showSnackbar('File attachments disabled in Premium Local mode', 'rgb(255, 100, 100)');
      return;
    }
    fileInput.click();
    });

    //v14
    fileInput.addEventListener('change', function () {
      if (fileInput.files.length > 0) {
        attachedFiles = Array.from(fileInput.files);
        attachBtn.textContent = '✔';
        attachedFiles.forEach((file) => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
              file.dataUrl = e.target.result;
            };
            reader.readAsDataURL(file);
          } else {
            file.dataUrl = null;
          }
        });
        selectedFileName.textContent = attachedFiles.map((file) => file.name).join(', ');
      } else {
        attachedFiles = [];
        attachBtn.textContent = '📎';
        selectedFileName.textContent = '';
      }
      console.log(attachedFiles);
    });

    creditAccountSelector.addEventListener('change', function () {
      const selectedIndex = this.value;
      currentCreditAccount = creditAccounts[selectedIndex];
      tokensDisplay.textContent = `${currentCreditAccount.balance.amount}`;
      populateBotSelector();
    });

    useFolderBtn.addEventListener('click', function() {
      showSnackbar('Folder selected successfully', 'rgb(0, 167, 44)');
      useOrNot = true;
      folderPopup.style.display = 'none';
      viewFolderBtn.innerHTML = '✓ Confirmed';
      viewFolderBtn.style.backgroundColor = '#4CAF50';
      viewFolderBtn.style.cursor = 'default';
      // viewFolderBtn.disabled = true;
    });

    cancelFolderBtn.addEventListener('click', function() {
      folderPopup.style.display = 'none';
      
    });

    closePopupBtn.addEventListener('click', function() {
      folderPopup.style.display = 'none';
    });

    // Show/hide view button based on input
    inputFolder.addEventListener('input', function(e) {
      viewFolderBtn.style.display = e.target.value.trim() ? 'block' : 'none';
      if (e.target.value.trim()) {
        viewFolderBtn.disabled = false;
        viewFolderBtn.innerHTML = 'Confirm';
        viewFolderBtn.style.backgroundColor = '#8d0033'; // Original color
        viewFolderBtn.style.cursor = 'pointer';
      }
    });

    // Close popup when clicking outside
    window.addEventListener('click', function(event) {
      if (event.target === folderPopup) {
        folderPopup.style.display = 'none';
      }
    });

    viewFolderBtn.addEventListener('click', async function() {
      const folderId = inputFolder.value.trim();
      if (outputFolder.value.trim() === '') {
        outputfolderName = folderName;
      }
      if (!currentBot) {
        showSnackbar('Please select a model', 'rgb(255, 100, 100)');
        return;
      }
      try {
        // Show loading state
        folderStatsDiv.innerHTML = '<p>Loading folder contents...</p>';
        folderPopup.style.display = 'block';
        useFolderBtn.disabled = true;
        
        let stats;
        
        // Handle different storage modes
        if (sourceMode === 'premium') {
          // Dropbox API mode
          const response = await fetch('https://us-central1-gdrive-functions.cloudfunctions.net/getFolderInfo/folder-stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': "{{ settings.langya_secret_key }}"
            },
            body: JSON.stringify({
              baseUrl: "https://us-central1-lt-bot-setup-v2.cloudfunctions.net/dropboxapiv4direct_aib_test2",
              userId: CUSTOMER_ID,
              folderId: folderId,
              sourceMode
            })
          });
          stats = await response.json();
        } 
        else if (sourceMode === 'premiumd') {
          // Google Drive API mode
          const response = await fetch('https://us-central1-gdrive-functions.cloudfunctions.net/getFolderInfo/folder-stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': "{{ settings.langya_secret_key }}"
            },
            body: JSON.stringify({
              baseUrl: "https://us-central1-lt-bot-setup-v2.cloudfunctions.net/gdriveapiv7direct_aib_test2",
              userId: CUSTOMER_ID,
              folderId: folderId,
              sourceMode
            })
          });
          stats = await response.json();
        } else if (sourceMode === 'premiumod'){
           const response = await fetch('https://us-central1-gdrive-functions.cloudfunctions.net/getFolderInfo/folder-stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': "{{ settings.langya_secret_key }}"
            },
            body: JSON.stringify({
              baseUrl: "https://us-central1-gdrive-functions.cloudfunctions.net/onedriveapiv1direct",
              userId: CUSTOMER_ID,
              folderId: folderId,
              sourceMode
            })
          });
          stats = await response.json();

        } else {
          try {
            const files = [];
            let totalSizeBytes = 0;
            for await (const entry of lcdirectoryHandle.values()) {
              if (entry.kind === 'file') {
                const file = await entry.getFile();
                files.push({
                  name: entry.name,
                  size: formatFileSize(file.size),
                  sizeBytes: file.size
                });
                totalSizeBytes += file.size;
              }
            }
            
            stats = {
              totalFiles: files.length,
              totalSize: formatFileSize(totalSizeBytes),
              files: files,
              calculatedCost: calculateCost(totalSizeBytes)
            };

            folderName = lcdirectoryHandle.name || 'Local Folder';
          } catch (error) {
            throw new Error('Local folder access denied or failed: ' + error.message);
          }
        }

        // Process the response data (same for all modes)
        const totalSizeMB = parseFloat(stats.totalSize.replace(' MB', '')) || 
                          (stats.totalSizeBytes ? stats.totalSizeBytes / (1024 * 1024) : 0);
        
        let hasLargeFiles = false;
        let errorMessage = '';

        for (const file of stats.files) {
          const fileSizeMB = parseFloat(file.size.replace('MB', '')) || 
                            (file.sizeBytes ? file.sizeBytes / (1024 * 1024) : 0);
          if (fileSizeMB > 25) {
            hasLargeFiles = true;
            break;
          }
        }
        if (sourceMode === 'premiuml' && stats.totalFiles > 1){
          errorMessage += `Only one file is allowed in Premium Local mode.`;
        }
        if (totalSizeMB > 50) {
          errorMessage += `Total folder size (${totalSizeMB.toFixed(2)}MB) exceeds 50MB limit. `;
        }
        if (hasLargeFiles) {
          errorMessage += `Folder contains files larger than 25MB.`;
        }
        const resp_cc = await fetch('https://us-central1-gdrive-functions.cloudfunctions.net/firestore_v1/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': langya_secret_key },
            body: JSON.stringify({
                collectionName: 'data-entry-test'
            })
        })
        const dat_cc = await resp_cc.json();
        console.log(currentBot?.Model);
        const entry = dat_cc.results.find(item => item["Model"] === currentBot?.Model);
        const calculatedCost = entry ? entry["AI Credit"] : 0.0;
        console.log('calculatedCost: ', calculatedCost);
        console.log('currency chosen: ', currentCreditAccount.balance.currencyCode);
        const price = await calculateTokenConsumption(0, 0, currentCreditAccount.balance.currencyCode, calculatedCost);
        // Display the folder stats
        let html = `
          <p><strong>Input Folder Name:</strong> ${folderName}</p>
          <p><strong>Output Folder Name:</strong> ${outputfolderName}</p>
          <p><strong>Model Name:</strong> ${currentBot?.Model || 'Unselected'}</p>
          <p><strong>Total Files:</strong> ${stats.totalFiles}</p>
          <p><strong>Total Size (max. 50 MB):</strong> ${stats.totalSize}</p>
          <p><strong>Total Cost:</strong> HKD ${parseFloat(price).toFixed(3) * stats.totalFiles}</p>`;
    
        if (errorMessage) {
          html += `<p class="error-message"><strong>Error:</strong> ${errorMessage}</p>`;
          useFolderBtn.disabled = true;
        } else {
          useFolderBtn.disabled = false;
        }

        html += `<p><strong>Files:</strong></p><ul>`;
        for (const file of stats.files) {
          const fileSizeMB = parseFloat(file.size.replace(' MB', '')) || (file.sizeBytes ? file.sizeBytes / (1024 * 1024) : 0);
          const fileClass = fileSizeMB > 25 ? 'class="large-file"' : '';
          html += `<li ${fileClass}>${file.name}: ${file.size}</li>`;
        }
        html += `</ul>`;
        
        folderStatsDiv.innerHTML = html;
        attachBtn.style.display = (sourceMode === 'premium' || sourceMode === 'premiumd' || sourceMode === 'premiuml') ? 'none' : 'block';
        
      } catch (error) {
        console.error('Error fetching folder stats:', error);
        folderStatsDiv.innerHTML = `
          <p class="error">Error loading folder: ${error.message}</p>
          <p>Please check the folder and try again.</p>`;
        useFolderBtn.disabled = true;
      }
    });

    document.getElementById('async-mode-checkbox').addEventListener('change', function () {
      asyncMode = this.checked;
      console.log('Async mode:', asyncMode);
    });
    
    const urlStorageMode = getUrlParameter('sourceMode');
    if (urlStorageMode === 'premium') {
      dbChooseFolderBtn.style.display = 'block';
      dbChooseOutputBtn.style.display = 'block';
      sourceMode = 'premium';
      storageMode = null;
      SourceModeSelector.value = 'premium';
      attachBtn.style.display = 'none';
      document.getElementById('folder-inputs').style.display = 'block';
    }
    if (urlStorageMode === 'premiumd') {
      gdChooseFolderBtn.style.display = 'block';
      gdChooseOutputBtn.style.display = 'block';
      sourceMode = 'premiumd';
      storageMode = null;
      SourceModeSelector.value = 'premiumd';
      attachBtn.style.display = 'none';
      document.getElementById('folder-inputs').style.display = 'block';
    }
    if (urlStorageMode === 'premiumod'){
        odChooseFolderBtn.style.display = 'block';
        odChooseOutputBtn.style.display = 'block';
        sourceMode = 'premiumod';
        storageMode = null;
        SourceModeSelector.value = 'premiumod';
        attachBtn.style.display = 'none';
        document.getElementById('folder-inputs').style.display = 'block';
    }

  });
</script>
