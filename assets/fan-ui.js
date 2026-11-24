"use strict";
(function (root) {
  function initializeFan({ storage, getSelection, getGameState, getEncounter, getPlayerPosition, hasArrived = () => true, onReveal, onVisit, onChange }) {
    const F = root.NBAFan, Island = root.NBAIsland;
    const $ = id => document.getElementById(id);
    const session = F.createFanSession(storage);
    const fanDialog = $("fan-dialog"), starDialog = $("star-dialog");
    const fields = ["nickname", "number", ...Object.keys(F.OPTIONS)];
    let teamId = "warriors", photo = null, view = "explore", source = "arena", exporting = false, downloadURL = null;
    let albumTab = "home", encounterContext = null, revealedKey = null;
    const today = getEncounter || (() => F.dailyEncounter());
    const encounterKey = value => `${value.date}:${value.starId}:${value.locationId}`;
    const encounterStale = () => Boolean(encounterContext && encounterKey(encounterContext) !== encounterKey(today()));
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
      const position=getPlayerPosition?.()||{x:item.x+48,y:item.y+26,locationId:item.id,moving:false};
      const marker=$("fan-map-marker"),saved=session.getState().saved;
      marker.style.left = `${position.x / Island.MAP.width * 100}%`;
      marker.style.top = `${position.y / Island.MAP.height * 100}%`;
      marker.dataset.location = position.moving?"":position.locationId;
      marker.dataset.x=String(position.x);marker.dataset.y=String(position.y);
      marker.setAttribute("aria-label",`${saved.nickname}，${position.moving?"沿道路移動中":"目前在"+([...Island.TEAMS,...Island.COURTS,...Island.ENCOUNTERS].find(p=>p.id===position.locationId)?.name||item.name)}`);
      $("fan-map-name").textContent=`我・${Array.from(saved.nickname).slice(0,6).join("")}`;
      // 移動時只更新位置；換裝儲存後才重新產生角色圖層。
      const avatar=JSON.stringify(saved);
      if(marker.dataset.avatar!==avatar){marker.dataset.avatar=avatar;$("fan-map-avatar").innerHTML = F.avatarSVG(saved);}
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
      const isEncounter = albumTab === "encounter";
      $("fan-album-count").textContent = `已收集 ${isEncounter ? state.encounterCollected : state.collected}／${F.STATIONS.length}`;
      $("fan-album-title").textContent = isEncounter ? "偶遇合影冊" : "主場合影冊";
      $("album-tab-home").setAttribute("aria-pressed", String(!isEncounter));$("album-tab-encounter").setAttribute("aria-pressed", String(isEncounter));
      $("album-tab-home-count").textContent = `${state.collected}／${F.STATIONS.length}`;$("album-tab-encounter-count").textContent = `${state.encounterCollected}／${F.STATIONS.length}`;
      $("fan-album-grid").replaceChildren();
      for (const station of F.STATIONS) {
        const savedPhoto = isEncounter ? state.encounters[station.starId] : state.homeAlbum[station.arenaId], team = Island.getLandmark("nba", station.teamId);
        const button = document.createElement("button");button.type = "button";button.className = "album-card";
        button.dataset.teamId = station.teamId;button.dataset.starId = station.starId;button.dataset.collected = String(Boolean(savedPhoto));
        if (savedPhoto) {
          const image = document.createElement("img");image.src = F.svgDataURL(F.photoSVG(savedPhoto));
          image.alt = `${savedPhoto.avatar.nickname}與${station.starName}在${F.photoInfo(savedPhoto).venue}的收藏合影`;
          image.width = 960;image.height = 640;button.append(image);
        } else {
          const empty = document.createElement("span");empty.className = "album-empty";empty.textContent = team.abbr;button.append(empty);
        }
        const title = document.createElement("strong");title.textContent = isEncounter ? station.starName : team.name;button.append(title);
        const detail = document.createElement("small");detail.textContent = savedPhoto ? `${F.photoDate(savedPhoto.capturedAt)}・${F.photoInfo(savedPhoto).venue}` : isEncounter ? `${team.name}・到島上探索` : `${station.starName}・前往尋星`;button.append(detail);
        button.addEventListener("click", () => {
          fanDialog.close();
          if (savedPhoto) openSavedPhoto(savedPhoto);
          else if (isEncounter) onVisit(Island.ENCOUNTERS[0].id, "encounter");
          else { onVisit(station.teamId); openArena(station.teamId); }
        });
        $("fan-album-grid").append(button);
      }
    }
    function updateNight() {
      const isEncounter = Boolean(encounterContext);
      $("photo-home-options").hidden = isEncounter;
      $("photo-location-hint").hidden = !isEncounter;
      if (isEncounter) $("photo-location-hint").textContent = `${Island.getLandmark("encounter", encounterContext.locationId).name}・偶遇場景與模擬賽況各自運作。`;
      const allowed = F.nightAvailable(teamId, getGameState());
      $("photo-night-option").disabled = !allowed;
      $("photo-night-hint").textContent = allowed ? "本場主隊 LIVE・可選夜場燈光（模擬賽事）" : "一般合影隨時開放；只有本場 LIVE 的主場能選夜場燈光。";
      if (!photo && !allowed && $("photo-background").value === "night") $("photo-background").value = "day";
    }
    function renderPhoto() {
      updateNight();
      const record = photo || liveRecord();
      const { star: station, team, venue, backgroundLabel, encounter } = F.photoInfo(record);
      $("photo-image").src = F.svgDataURL(F.photoSVG(record));
      $("photo-image").alt = `${record.avatar.nickname}與${station.starName}在${venue}的${backgroundLabel}合影，${record.pose === "ball" ? "舉球" : "站姿"}`;
      $("photo-caption").textContent = photo ? `定格照片・${F.photoDate(record.capturedAt)}（台灣時間）` : "即時構圖・使用已儲存造型，拍照後定格。";
      for (const [id, value] of [["photo-fan-name", record.avatar.nickname], ["photo-star-name", station.starName], ["photo-team-name", team.name], ["photo-venue-name", venue], ["photo-date", photo ? F.photoDate(record.capturedAt) + "（台灣）" : "按拍照時記錄"]]) $(id).textContent = value;
      $("photo-pose").disabled = Boolean(photo);$("photo-background").disabled = Boolean(photo);
      $("capture-photo").hidden = Boolean(photo);$("retake-photo").hidden = !photo;
      $("capture-photo").disabled = exporting || encounterStale();$("retake-photo").disabled = exporting;$("photo-back-scene").disabled = exporting;
      $("collect-photo").disabled = !photo || exporting;$("download-photo").disabled = !photo || exporting;
      const exists = encounter ? session.getState().encounters[record.starId] : session.getState().homeAlbum[station.arenaId];
      $("collect-photo").textContent = exists ? (encounter ? "更新這位球星收藏" : "更新這隊收藏") : "收藏合影";
      $("photo-back-scene").textContent = encounter ? "回到偶遇地點" : "回到球館";
      if (!photo && encounterStale()) $("photo-status").textContent = "偶遇日期已更新，請回地點重新探索。舊收藏仍可查看與下載。";
      storageNotice();
    }
    function openArena(id) {
      const station = F.getStation(id);if (!station) return;
      teamId = id;photo = null;encounterContext = null;view = "explore";source = "arena";clearDownload();
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
      encounterContext = record.kind === "encounter" ? { date: record.encounterDate, teamId: record.teamId, starId: record.starId, locationId: record.locationId } : null;
      const station = F.getStation(teamId);
      $("star-dialog-title").textContent = "合影冊｜拍攝當時的你";$("star-era-label").textContent = `${station.starName}・${station.label}`;
      $("photo-pose").value = photo.pose;$("photo-background").value = photo.background;
      $("arena-explore").hidden = true;$("photo-studio").hidden = false;
      $("photo-status").textContent = "這是收藏時的造型快照，之後換裝不會改動這張照片。";
      renderPhoto();if (!starDialog.open) starDialog.showModal();$("photo-studio-title").focus();
    }
    function refreshGame() { if (starDialog.open) { updateNight();if (view === "studio" && !photo) renderPhoto(); } }
    function liveRecord() {
      return encounterContext ? F.createEncounterPhoto(encounterContext, session.getState().saved, { pose: $("photo-pose").value }) : F.createPhoto(teamId, session.getState().saved, { pose: $("photo-pose").value, background: $("photo-background").value }, getGameState());
    }
    function renderEncounterPanel(placeId) {
      const encounter = today(), place = Island.getLandmark("encounter", placeId), arrived=hasArrived(placeId), present = encounter.locationId === placeId && arrived;
      const revealed = present && revealedKey === encounterKey(encounter), star = F.getStar(encounter.starId);
      $("encounter-date").textContent = `${encounter.date}・台灣日期`;
      $("encounter-scene-image").src = place.background;$("encounter-scene-image").alt = `${place.name}・${place.scene}`;
      $("encounter-presence").textContent = !arrived ? "沿道路前往中；抵達後再看看附近有誰。" : present ? "附近有熟悉的身影……" : "這裡今天很安靜，沿著島上的步道去其他地點看看吧。";
      $("encounter-character").hidden = !present;$("encounter-character").dataset.revealed = String(revealed);
      if (present) { $("encounter-portrait").src = star.illustration;$("encounter-portrait").alt = revealed ? `${star.starName}，${star.label}` : "熟悉的身影，點擊揭曉身分"; }
      $("encounter-character").setAttribute("aria-label", revealed ? `代表球星 ${star.starName}` : "點擊熟悉的身影，揭曉身分");
      $("encounter-character-label").textContent = revealed ? star.starName : "點擊揭曉";
      $("encounter-reveal").hidden = !revealed;
      $("encounter-star-name").textContent = revealed ? `${star.starName}・${Island.getLandmark("nba", star.teamId).name}` : "";
      $("encounter-greeting").textContent = revealed ? "遊戲招呼：在島上走走也要保持手感，一起留下今天的回憶吧！" : "";
      $("encounter-era-label").textContent = revealed ? star.label : "";
    }
    function openEncounter() {
      const encounter = today(), selected = getSelection();
      if (selected.kind !== "encounter" || selected.id !== encounter.locationId || !hasArrived(encounter.locationId) || revealedKey !== encounterKey(encounter)) return;
      encounterContext = { ...encounter };teamId = encounter.teamId;photo = null;source = "encounter";view = "studio";clearDownload();
      const star = F.getStar(encounter.starId), place = Island.getLandmark("encounter", encounter.locationId);
      $("star-dialog-title").textContent = `${place.name}｜島上偶遇`;
      $("star-era-label").textContent = `${star.starName}・${star.label}・島上遊戲情境`;
      $("photo-pose").value = "stand";$("photo-background").value = "day";$("photo-status").textContent = "";
      $("arena-explore").hidden = true;$("photo-studio").hidden = false;renderPhoto();
      if (!starDialog.open) starDialog.showModal();$("photo-studio-title").focus();
    }

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
    $("album-tab-home").addEventListener("click", () => { albumTab = "home";renderAlbum(); });
    $("album-tab-encounter").addEventListener("click", () => { albumTab = "encounter";renderAlbum(); });
    $("encounter-character").addEventListener("click", () => { const encounter = today();if (getSelection().kind !== "encounter" || getSelection().id !== encounter.locationId || !hasArrived(encounter.locationId)) return;revealedKey = encounterKey(encounter);renderEncounterPanel(encounter.locationId);onReveal?.(); });
    $("encounter-photo").addEventListener("click", openEncounter);
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
    starDialog.addEventListener("close", () => { clearDownload();if (source === "album") openFan("album");else if (source === "encounter") $("panel-title").focus();else $("find-star").focus(); });
    $("star-landmark").addEventListener("click", openStudio);
    $("photo-back-scene").addEventListener("click", () => { if (encounterContext) { const id = encounterContext.locationId;source = "encounter";starDialog.close();onVisit(id, "encounter");return; }if (source === "album") { onVisit(teamId);source = "arena"; }openArena(teamId); });
    $("photo-pose").addEventListener("change", () => { if (!photo) renderPhoto(); });
    $("photo-background").addEventListener("change", () => { if (!photo) renderPhoto(); });
    $("capture-photo").addEventListener("click", () => {
      if (photo || encounterStale()) return;
      photo = liveRecord();
      clearDownload();renderPhoto();$("photo-status").textContent = "喀嚓！照片已定格，可收藏或下載 PNG。";
    });
    $("retake-photo").addEventListener("click", () => { photo = null;clearDownload();$("photo-status").textContent = "重新構圖中，使用目前已儲存造型；舊收藏要按收藏才會更新。";renderPhoto(); });
    $("collect-photo").addEventListener("click", () => {
      if (!photo || exporting) return;
      session.collect(photo);albumTab = photo.kind === "encounter" ? "encounter" : "home";renderAlbum();renderPhoto();onChange();
      $("photo-status").textContent = `已收藏！${albumTab === "encounter" ? "偶遇" : "主場"}已收集 ${albumTab === "encounter" ? session.getState().encounterCollected : session.getState().collected}／${F.STATIONS.length}。同一${albumTab === "encounter" ? "球星" : "主場"}更新只計一次。`;
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
        const link = $("photo-png-link");link.href = downloadURL;link.download = `nba-policy-island-${record.kind === "encounter" ? "encounter-" + record.starId : record.teamId}-${record.capturedAt.slice(0, 10)}.png`;link.hidden = false;link.click();
        $("photo-status").textContent = "PNG 已產生，包含角色、球星、背景與照片文字。若沒有自動儲存，請按「另存 PNG」。";
      } catch { $("photo-status").textContent = "PNG 匯出未完成，請再試一次或換支援 Canvas 的瀏覽器；收藏記錄仍保留。"; }
      finally { exporting = false;renderPhoto(); }
    });
    window.addEventListener("pagehide", clearDownload);
    return { getState: session.getState, updateLocation, refreshGame, renderEncounterPanel, openFan, openArena, savedAvatar: () => session.getState().saved, renderAvatar: avatar => F.avatarSVG(avatar) };
  }
  root.NBAFanUI = { initializeFan };
})(typeof globalThis !== "undefined" ? globalThis : this);
