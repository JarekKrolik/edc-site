(function () {
  var cfg = window.EDC_REALIZATIONS || {};
  var url = String(cfg.url || "").replace(/\/$/, "");
  var anonKey = String(cfg.anonKey || "");
  if (!url || !anonKey || url.indexOf("your-project.supabase.co") !== -1 || anonKey === "your-anon-key") {
    return;
  }

  var PATHS = {
    iwb: "/kabury-do-broni-palnej",
    owb: "/kabury-zewnetrzne",
  };
  var LABELS = { iwb: "IWB", owb: "OWB" };

  function photosOf(item) {
    var rows = Array.isArray(item.realization_photos) ? item.realization_photos.slice() : [];
    rows.sort(function (a, b) {
      return (a.sort || 0) - (b.sort || 0);
    });
    return rows.filter(function (row) {
      return row && row.url;
    });
  }

  function menuTitle(item) {
    return item.title || ("Kabura " + (LABELS[item.category] || "") + " " + (item.firearm_model || "")).trim();
  }

  function injectMenu(items) {
    var nav = document.getElementById("nav-projects");
    if (!nav) return;
    items.forEach(function (item) {
      if (!item.slug || !PATHS[item.category]) return;
      if (nav.querySelector('[data-realization-id="' + item.id + '"]')) return;
      if (document.getElementById(item.slug) && nav.querySelector('a[href$="#' + item.slug + '"]')) return;
      var li = document.createElement("li");
      li.setAttribute("data-realization-id", item.id);
      var a = document.createElement("a");
      a.className = "nav__link";
      a.href = PATHS[item.category] + "#" + item.slug;
      a.textContent = menuTitle(item);
      li.appendChild(a);
      nav.appendChild(li);
    });
  }

  function renderSection(item) {
    var photos = photosOf(item);
    var first = photos[0];
    var section = document.createElement("section");
    section.className = "project";
    section.id = item.slug;
    section.setAttribute("data-realization-id", item.id);

    var split = document.createElement("div");
    split.className = "container project__split";

    var media = document.createElement("div");
    media.className = "project__media";

    if (first) {
      var img = document.createElement("img");
      img.className = "project__image";
      img.src = first.url;
      img.alt = menuTitle(item);
      img.loading = "lazy";
      img.decoding = "async";
      img.width = 480;
      img.height = 384;
      media.appendChild(img);

      if (photos.length > 1) {
        var thumbs = document.createElement("div");
        thumbs.className = "project__thumbs";
        photos.forEach(function (photo, index) {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "project__thumb" + (index === 0 ? " is-active" : "");
          var thumb = document.createElement("img");
          thumb.src = photo.url;
          thumb.alt = "";
          button.appendChild(thumb);
          button.addEventListener("click", function () {
            img.src = photo.url;
            thumbs.querySelectorAll(".project__thumb").forEach(function (el) {
              el.classList.toggle("is-active", el === button);
            });
          });
          thumbs.appendChild(button);
        });
        media.appendChild(thumbs);
      }
    }

    var caption = document.createElement("div");
    caption.className = "card card--invert card--slab project__caption";
    var heading = document.createElement("h5");
    heading.textContent = item.description || menuTitle(item);
    caption.appendChild(heading);

    split.appendChild(media);
    split.appendChild(caption);
    section.appendChild(split);
    return section;
  }

  function injectPage(items) {
    var host = document.getElementById("dynamic-realizations");
    if (!host) return;
    var category = host.getAttribute("data-category");
    items
      .filter(function (item) {
        return item.category === category && item.slug && !document.getElementById(item.slug);
      })
      .forEach(function (item) {
        host.appendChild(renderSection(item));
      });

    if (location.hash) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
  }

  var endpoint =
    url +
    "/rest/v1/realizations?select=id,slug,category,title,firearm_model,description,sort,created_at,realization_photos(id,url,sort)&order=sort.desc,created_at.desc";

  fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: "Bearer " + anonKey,
      Accept: "application/json",
    },
  })
    .then(function (response) {
      if (!response.ok) throw new Error("realizations " + response.status);
      return response.json();
    })
    .then(function (rows) {
      if (!Array.isArray(rows) || rows.length === 0) return;
      injectMenu(rows);
      injectPage(rows);
    })
    .catch(function () {
      /* strona statyczna zostaje bez zmian */
    });
})();
