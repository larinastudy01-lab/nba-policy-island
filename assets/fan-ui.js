"use strict";
(function (root) {
  function initializeFan({ storage, getSelection, getGameState, onVisit, onChange }) {
    const F = root.NBAFan, Island = root.NBAIsland;
    const $ = id => document.getElementById(id);
    const session = F.createFanSession(storage);
    const fanDialog = $("fan-dialog"), starDialog = $("star-dialog");
    const fields = ["nickname", "number", ...Object.keys(F.OPTIONS)];
    let teamId = "warriors", photo = null, view = "explore", source = "arena", exporting = false, downloadURL = null;
    const readFields = () => Object.fromEntries(fields.map(name => [name, $(`fan-${name}`).value]));

    function storageNotice() {
      $("fan-storage-notice").hidden = session.getState().storageAvailable;
      $("fan-storage-notice").textContent = "無法使用本機儲存空間。造型、合影與收藏仍可在本次頁面使用和下載，重新整理後可能不保留。";
      $("photo-storage-notice").hidden = session.getState().storageAvailable;
      $("photo-storage-notice").textContent = "收藏僅保留於本次頁面，請下載 PNG 保存。";
    }
    function renderDraft(fillFields = false) {
      const { draft, saved } = session.getState();
      if (fillFields) for (const key of fields) $(`fan-${key}`).value = draft[key];
      $("avatar-preview").innerHTML = F.avatarSVG(draft);
      $("fan-draft-label").textContent = JSON.stringify(draft) === JSON.stringify(saved) ? "與目前套用造型相同" : "試穿中・按儲存才套用";
      $("fan-saved-summary").textContent = `目前套用：${saved.nickname}・${Island.getLandmark("nba", saved.jersey).name} ${saved.number} 號`;
      storageNotice();
    }
    function updateLocation(selection = getSelection()) {
      const item = Island.getLandmark(selection.kind, selection.id);
      if (!item) return;
      $("fan-map-marker").style.left = `${(item.x + 48) / 1200 * 100}%`;
      $("fan-map-marker").style.top = `${(item.y + 26) / 800 * 100}%`;
      $("fan-map-marker").dataset.location = item.id;
      $("fan-map-marker").setAttribute("aria-label",`${session.getState().saved.nickname}，我目前在${item.name}`);
      $("fan-map-avatar").innerHTML = F.avatarSVG(session.getState().saved);
    }
    function setTab(tab) {
      $("fan-wardrobe").hidden = tab !== "wardrobe";
      $("fan-album").hidden = tab !== "album";
      $("fan-tab-wardrobe").setAttribute("aria-pressed", String(tab === "wardrobe"));
      $("fan-tab-album").setAttribute("aria-pressed", String(tab === "album"));
      if (tab === "album") renderAlbum();
    }
    function openFan(tab = "wardrobe") {
      setTab(tab); renderDraft();
      if (!fanDialog.open) fanDialog.showModal();
      (tab === "album" ? $("fan-album-title") : $("fan-nickname")).focus();
    }
    function clearDownload() {
      if (downloadURL) { URL.revokeObjectURL(downloadURL); downloadURL = null; }
      $("photo-png-link").hidden = true;$("photo-png-link").removeAttribute("href");
    }
    function renderAlbum() {
      const state = session.getState();
      $("fan-album-count").textContent = `已收集 ${state.collected}／${F.STATIONS.length}`;
      $("fan-album-grid").replaceChildren();
      for (const station of F.STATIONS) {
        const savedPhoto = state.album[station.teamId], team = Island.getLandmark("nba", station.teamId);
        const button = document.createElement("button");button.type = "button";button.className = "album-card";
        button.dataset.teamId = station.teamId;button.dataset.collected = String(Boolean(savedPhoto));
        if (savedPhoto) {
          const image = document.createElement("img");image.src = F.svgDataURL(F.photoSVG(savedPhoto));
          image.alt = `${savedPhoto.avatar.nickname}與${station.starName}在${station.venue}的收藏合影`;
          image.width = 960;image.height = 640;button.append(image);
        } else {
          const empty = document.createElement("span");empty.className = "album-empty";empty.textContent = team.abbr;button.append(empty);
        }
        const title = document.createElement("strong");title.textContent = team.name;button.append(title);
        const detail = document.createElement("small");detail.textContent = savedPhoto ? `${F.photoDate(savedPhoto.capturedAt)}・查看舊合影` : `${station.starName}・前往尋星`;button.append(detail);
        button.addEventListener("click", () => {
          fanDialog.close();
          if (savedPhoto) openSavedPhoto(savedPhoto);
          else { onVisit(station.teamId); openArena(station.teamId); }
        });
        $("fan-album-grid").append(button);
      }
    }
    function updateNight() {
      const allowed = F.nightAvailable(teamId, getGameState());
      $("photo-night-option").disabled = !allowed;
      $("photo-night-hint").textContent = allowed ? "本場主隊 LIVE・可選夜場燈光（模擬賽事）" : "一般合影隨時開放；只有本場 LIVE 的主場能選夜場燈光。";
      if (!photo && !allowed && $("photo-background").value === "night") $("photo-background").value = "day";
    }
    function renderPhoto() {
      updateNight();
      const record = photo || F.createPhoto(teamId, session.getState().saved, { pose: $("photo-pose").value, background: $("photo-background").value }, getGameState());
      const station = F.getStation(record.teamId), team = Island.getLandmark("nba", record.teamId);
      $("photo-image").src = F.svgDataURL(F.photoSVG(record));
      $("photo-image").alt = `${record.avatar.nickname}與${station.starName}在${station.venue}的${record.background === "night" ? "夜場" : "一般"}合影，${record.pose === "ball" ? "舉球" : "站姿"}`;
      $("photo-caption").textContent = photo ? `定格照片・${F.photoDate(record.capturedAt)}（台灣時間）` : "即時構圖・使用已儲存造型，拍照後定格。";
      for (const [id, value] of [["photo-fan-name", record.avatar.nickname], ["photo-star-name", station.starName], ["photo-team-name", team.name], ["photo-venue-name", station.venue], ["photo-date", photo ? F.photoDate(record.capturedAt) + "（台灣）" : "按拍照時記錄"]]) $(id).textContent = value;
      $("photo-pose").disabled = Boolean(photo);$("photo-background").disabled = Boolean(photo);
      $("capture-photo").hidden = Boolean(photo);$("retake-photo").hidden = !photo;
      $("capture-photo").disabled = exporting;$("retake-photo").disabled = exporting;$("photo-back-scene").disabled = exporting;
      $("collect-photo").disabled = !photo || exporting;$("download-photo").disabled = !photo || exporting;
      $("collect-photo").textContent = session.getState().album[teamId] ? "更新這隊收藏" : "收藏合影";
      storageNotice();
    }
    function openArena(id) {
      const station = F.getStation(id);if (!station) return;
      teamId = id;photo = null;view = "explore";source = "arena";clearDownload();
      const team = Island.getLandmark("nba", id);
      $("star-dialog-title").textContent = `${team.name}｜主場尋星`;
      $("star-era-label").textContent = `${station.starName}・${station.label}`;
      $("arena-explore").hidden = false;$("photo-studio").hidden = true;
      $("arena-background").src = station.background;$("arena-background").alt = `${station.venue}：原創看台、木地板與球員通道場景`;
      $("star-portrait").src = station.illustration;$("star-portrait").alt = `${station.starName}的原創 Q 版隊史致敬插畫`;
      $("star-landmark").style.left = `${station.x}%`;$("star-landmark").style.top = `${station.y}%`;
      $("star-landmark").setAttribute("aria-label",`${station.point}找到${station.starName}，按下進入合影`);
      $("arena-clue").textContent = `合影點：${station.point}。點場景中的${station.starName}，或用 Tab 選取後按 Enter。`;
      $("star-spot-label").textContent = `${station.starName}・點我合影`;
      $("arena-visitor").innerHTML = F.avatarSVG(session.getState().saved);
      $("arena-caption").textContent = `${station.venue}・${station.point}・${station.label}。場景為自訂設計。`;
      $("photo-pose").value = "stand";$("photo-background").value = "day";updateNight();
      $("photo-status").textContent = "";
      if (!starDialog.open) starDialog.showModal();$("star-dialog-title").focus();
    }
    function openStudio() {
      view = "studio";$("arena-explore").hidden = true;$("photo-studio").hidden = false;
      renderPhoto();$("photo-studio-title").focus();
    }
    function openSavedPhoto(record) {
      teamId = record.teamId;photo = F.normalizePhoto(record);source = "album";view = "studio";clearDownload();
      const station = F.getStation(teamId);
      $("star-dialog-title").textContent = "合影冊｜拍攝當時的你";$("star-era-label").textContent = `${station.starName}・${station.label}`;
      $("photo-pose").value = photo.pose;$("photo-background").value = photo.background;
      $("arena-explore").hidden = true;$("photo-studio").hidden = false;
      $("photo-status").textContent = "這是收藏時的造型快照，之後換裝不會改動這張照片。";
      renderPhoto();if (!starDialog.open) starDialog.showModal();$("photo-studio-title").focus();
    }
    function refreshGame() { if (starDialog.open) { updateNight();if (view === "studio" && !photo) renderPhoto(); } }

    for (const [key, options] of Object.entries(F.OPTIONS)) {
      for (const [value, label] of options) { const option = document.createElement("option");option.value = value;option.textContent = label;$(`fan-${key}`).append(option); }
    }
    renderDraft(true);renderAlbum();updateLocation();
    for (const key of fields) {
      const edit = () => { session.edit(readFields());renderDraft(); };
      $(`fan-${key}`).addEventListener("input", edit);$(`fan-${key}`).addEventListener("change", edit);
    }
    $("my-fan").addEventListener("click", () => openFan());
    $("fan-close").addEventListener("click", () => fanDialog.close());
    fanDialog.addEventListener("close", () => { if (!starDialog.open) $("my-fan").focus(); });
    $("fan-tab-wardrobe").addEventListener("click", () => setTab("wardrobe"));
    $("fan-tab-album").addEventListener("click", () => setTab("album"));
    $("fan-random").addEventListener("click", () => { session.randomize();renderDraft(true);$("fan-status").textContent = "隨機搭配已放入預覽，按儲存才套用。"; });
    $("fan-form").addEventListener("reset", event => { event.preventDefault();session.reset();renderDraft(true);$("fan-status").textContent = "預覽已重設為新秀造型，收藏與已套用造型保留；按儲存才套用。"; });
    $("fan-form").addEventListener("submit", event => {
      event.preventDefault();
      if (!$("fan-nickname").value.trim() || !/^\d{1,2}$/.test($("fan-number").value)) { $("fan-status").textContent = "請填寫暱稱及 0–99 的背號。";return; }
      session.edit(readFields());
      session.save();renderDraft(true);updateLocation();onChange();
      $("fan-status").textContent = session.getState().storageAvailable ? "造型已儲存並套用到島圖、合影及單機結算。" : "造型已套用於本次頁面；無法永久儲存。";
    });
    $("find-star").addEventListener("click", () => { const selected = getSelection();if (selected.kind === "nba") openArena(selected.id); });
    $("star-close").addEventListener("click", () => starDialog.close());
    starDialog.addEventListener("close", () => { clearDownload();if (source === "album") openFan("album");else $("find-star").focus(); });
    $("star-landmark").addEventListener("click", openStudio);
    $("photo-back-scene").addEventListener("click", () => { if (source === "album") { onVisit(teamId);source = "arena"; }openArena(teamId); });
    $("photo-pose").addEventListener("change", () => { if (!photo) renderPhoto(); });
    $("photo-background").addEventListener("change", () => { if (!photo) renderPhoto(); });
    $("capture-photo").addEventListener("click", () => {
      if (photo) return;
      photo = F.createPhoto(teamId, session.getState().saved, { pose: $("photo-pose").value, background: $("photo-background").value }, getGameState());
      clearDownload();renderPhoto();$("photo-status").textContent = "喀嚓！照片已定格，可收藏或下載 PNG。";
    });
    $("retake-photo").addEventListener("click", () => { photo = null;clearDownload();renderPhoto();$("photo-status").textContent = "重新構圖中，使用目前已儲存造型；舊收藏要按收藏才會更新。"; });
    $("collect-photo").addEventListener("click", () => {
      if (!photo || exporting) return;
      session.collect(photo);renderAlbum();renderPhoto();onChange();
      $("photo-status").textContent = `已收藏！已收集 ${session.getState().collected}／${F.STATIONS.length} 個主場。同隊更新仍只計一站。`;
    });
    $("download-photo").addEventListener("click", async () => {
      if (!photo || exporting) return;
      exporting = true;renderPhoto();$("photo-status").textContent = "正在產生 960 × 640 PNG…";
      try {
        const record = F.normalizePhoto(photo);
        if (document.fonts) await document.fonts.ready;
        const blob = await F.exportPNG(record);
        if (!starDialog.open || JSON.stringify(photo) !== JSON.stringify(record)) return;
        clearDownload();downloadURL = URL.createObjectURL(blob);
        const link = $("photo-png-link");link.href = downloadURL;link.download = `nba-policy-island-${record.teamId}-${record.capturedAt.slice(0, 10)}.png`;link.hidden = false;link.click();
        $("photo-status").textContent = "PNG 已產生，包含角色、球星、背景與照片文字。若沒有自動儲存，請按「另存 PNG」。";
      } catch { $("photo-status").textContent = "PNG 匯出未完成，請再試一次或換支援 Canvas 的瀏覽器；收藏記錄仍保留。"; }
      finally { exporting = false;renderPhoto(); }
    });
    window.addEventListener("pagehide", clearDownload);
    return { getState: session.getState, updateLocation, refreshGame, openFan, openArena, savedAvatar: () => session.getState().saved, renderAvatar: avatar => F.avatarSVG(avatar) };
  }
  root.NBAFanUI = { initializeFan };
})(typeof globalThis !== "undefined" ? globalThis : this);
