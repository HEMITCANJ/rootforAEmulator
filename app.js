/*
 * rootforAEmulator 站点脚本
 * 版本信息从 version.json 半动态加载；加载失败时回落到下面的内置快照，
 * 保证离线或 file:// 打开时页面依然完整。
 */
(function () {
  "use strict";

  /* ===================================================================
   * TODO 改下载链接（要用 GitHub Release 下载时看这里）
   * 目前下载按钮优先下载与页面同目录的站内文件（files[].file）。
   * 要改成走 GitHub Release 下载，共两步：
   *   1. 把下面 btn.href / heroDl.href 两行的 f.file || f.url 顺序对调（url 优先）
   *   2. 把 url 地址前缀
   *      https://github.com/hemitcanj/rootforAEmulator/releases/download/v1.0.0/
   *      换成你自己的仓库 Release 下载前缀：
   *      https://github.com/<你的用户名>/<仓库名>/releases/download/<tag>/
   * url 副本在 version.json 的 files[].url 和下面 FALLBACK 里，两处同步改。
   * 文件名保持和 files[].file 一致，上传 Release 资产时用同样的名字。
   * =================================================================== */

  // version.json 拉取失败时的兜底数据，发新版时同步改这里和 version.json
  var FALLBACK = {
    version: "1.0.0",
    release_date: "2026-11-20",
    files: [
      {
        label: "APK 安装包",
        file: "rootforAEmulator-1.0.0-release.betaapk",
        url: "https://github.com/HEMITCANJ/TheRootForAEmulatorD/releases/download/v1.0.0beta/rootforAEmulator-1.0.0-release.beta.apk",
        size: "1.1 MB",
        sha256: "c3d2f66afa1b2baab82bc28f4c7bec9eb1ff08ebb338916fa789098703d5b213"
      },
      {
        label: "HTML 代码包",
        file: "rootforAEmulator-1.0.0-html.zip",
        url: "https://github.com/hemitcanj/rootforAEmulator/releases/download/v1.0.0/rootforAEmulator-1.0.0-html.zip",
        size: "19 KB"
      }
    ],
    changelog: [
      {
        version: "1.0.0",
        date: "2026-11-20",
        items: [
          "su 代理白名单：备份系统 su 为 su.rfae-real，替换为按 UID 放行的代理脚本",
          "白名单内嵌代理脚本 ALLOW_UIDS，更新即时生效，无额外文件读权限问题",
          "拒绝的 su 调用写入 /data/local/rfae/access.log，日志页可查看/清空",
          "部署时保留原 su 的 setuid 位与 SELinux 上下文",
          "检测到 Magisk 类 su（/sbin、/debug_ramdisk）自动拒绝部署",
          "一键恢复：用 su.rfae-real 还原系统原 su",
          "release 构建：R8 混淆压缩（不加壳），包名 io.github.hemitcanj.rootforaemulator"
        ]
      }
    ]
  };

  var data = null;

  function fetchVersion() {
    return fetch("version.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .catch(function () {
        return FALLBACK;
      });
  }

  function renderVersions() {
    document.querySelectorAll("[data-version]").forEach(function (el) {
      el.textContent = "v" + data.version;
    });
    var dateEl = document.querySelector("[data-release-date]");
    if (dateEl) dateEl.textContent = data.release_date;
  }

  function renderDownloads() {
    var box = document.getElementById("dl-list");
    if (!box) return;
    box.innerHTML = "";

    data.files.forEach(function (f) {
      var card = document.createElement("div");
      card.className = "dl-card";

      var info = document.createElement("div");
      info.className = "dl-info";

      var title = document.createElement("b");
      title.textContent = f.label;
      info.appendChild(title);

      var fileLine = document.createElement("div");
      fileLine.className = "dl-file";
      fileLine.textContent = f.file + " · " + f.size;
      info.appendChild(fileLine);

      // 没有 sha256 的条目（如 HTML 代码包自身）不显示校验和
      if (f.sha256) {
        var hash = document.createElement("span");
        hash.className = "dl-hash";
        hash.title = "点击复制 SHA-256";
        var hashText = document.createElement("span");
        hashText.textContent = "SHA-256 " + f.sha256.slice(0, 12) + "…";
        hash.appendChild(hashText);

        hash.addEventListener("click", function () {
          var done = function () {
            hashText.classList.add("copied");
            hashText.textContent = "已复制";
            setTimeout(function () {
              hashText.classList.remove("copied");
              hashText.textContent = "SHA-256 " + f.sha256.slice(0, 12) + "…";
            }, 1500);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(f.sha256).then(done, done);
          } else {
            done();
          }
        });

        info.appendChild(hash);
      }

      var btn = document.createElement("a");
      btn.className = "btn btn-primary";
      // 优先下载站内文件 f.file，没有再走 f.url（GitHub Release，见文件顶部 TODO）
      btn.href = f.file || f.url;
      btn.setAttribute("download", "");
      btn.textContent = "下载";

      card.appendChild(info);
      card.appendChild(btn);
      box.appendChild(card);
    });
  }

  function renderChangelog() {
    var box = document.getElementById("changelog-list");
    if (!box) return;
    box.innerHTML = "";

    data.changelog.forEach(function (rel) {
      var wrap = document.createElement("div");
      wrap.className = "release";

      var head = document.createElement("div");
      head.className = "release-head";
      var ver = document.createElement("b");
      ver.textContent = "v" + rel.version;
      var date = document.createElement("span");
      date.className = "muted";
      date.textContent = rel.date;
      head.appendChild(ver);
      head.appendChild(date);
      wrap.appendChild(head);

      var ul = document.createElement("ul");
      rel.items.forEach(function (item) {
        var li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      wrap.appendChild(ul);

      box.appendChild(wrap);
    });
  }

  function render() {
    renderVersions();
    renderDownloads();
    renderChangelog();
    var heroDl = document.getElementById("hero-dl");
    if (heroDl && data.files[0]) {
      heroDl.href = data.files[0].file || data.files[0].url;
      heroDl.setAttribute("download", "");
    }
  }

  fetchVersion().then(function (json) {
    data = json;
    render();
  });
})();
