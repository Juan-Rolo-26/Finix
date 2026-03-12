window.addEventListener("error", function (e) {
    const div = document.createElement('div');
    div.style.color = 'red';
    div.style.background = 'white';
    div.style.padding = '20px';
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.zIndex = '999999';
    div.innerHTML = `<h1>Error:</h1><pre>${e.message}</pre><p>${e.filename}:${e.lineno}</p>`;
    document.body.appendChild(div);
});
window.addEventListener("unhandledrejection", function (e) {
    const div = document.createElement('div');
    div.style.color = 'red';
    div.style.background = 'white';
    div.style.padding = '20px';
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.zIndex = '999999';
    div.innerHTML = `<h1>Promise Error:</h1><pre>${e.reason}</pre>`;
    document.body.appendChild(div);
});
