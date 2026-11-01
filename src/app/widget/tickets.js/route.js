import { NextResponse } from 'next/server';

export function GET(request) {
  const origin = new URL(request.url).origin;
  const script = `(function () {
  var current = document.currentScript;
  var organization = current && current.dataset.organizationId;
  var key = current && current.dataset.publicKey;
  var launcherStyle = current && current.dataset.launcherStyle || 'fab';
  var widgetTitle = current && current.dataset.widgetTitle || 'How can we help?';
  var widgetGreeting = current && current.dataset.widgetGreeting || 'Send us a message and our team will get back to you.';
  var widgetColor = current && current.dataset.widgetColor || '#287c68';
  var widgetWidth = current && current.dataset.widgetWidth || '430';
  var widgetRadius = current && current.dataset.widgetRadius || '16';
  var widgetIcon = current && current.dataset.widgetIcon || 'S';
  if (!organization || !key) return;
  var button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', 'Contact support');
  button.textContent = '?';
  var buttonStyles = {
    fab: 'position:fixed;right:24px;bottom:24px;width:52px;height:52px;border:0;border-radius:50%;',
    sidebar: 'position:fixed;right:0;top:42%;width:42px;height:132px;border:0;border-radius:12px 0 0 12px;writing-mode:vertical-rl;',
    'bottom-bar': 'position:fixed;right:20px;bottom:20px;width:220px;height:44px;border:0;border-radius:22px;',
    inline: 'display:inline-flex;width:auto;height:42px;padding:0 18px;border:0;border-radius:21px;'
  };
  button.style.cssText = (buttonStyles[launcherStyle] || buttonStyles.fab) + 'align-items:center;justify-content:center;background:' + widgetColor + ';color:#fff;font:700 14px sans-serif;box-shadow:0 8px 20px rgba(25,70,53,.25);cursor:pointer;z-index:2147483646';
  button.style.display = 'inline-flex';
  button.textContent = launcherStyle === 'sidebar' ? 'Support' : launcherStyle === 'bottom-bar' ? 'Need help? Contact support' : launcherStyle === 'inline' ? 'Contact support' : '?';
  var frame = document.createElement('iframe');
  frame.title = 'Customer support';
  frame.src = ${JSON.stringify(origin + '/widget/tickets')} + '?organization=' + encodeURIComponent(organization) + '&key=' + encodeURIComponent(key) + '&title=' + encodeURIComponent(widgetTitle) + '&greeting=' + encodeURIComponent(widgetGreeting) + '&color=' + encodeURIComponent(widgetColor) + '&width=' + encodeURIComponent(widgetWidth) + '&radius=' + encodeURIComponent(widgetRadius) + '&icon=' + encodeURIComponent(widgetIcon);
  frame.style.cssText = 'display:none;position:fixed;right:24px;bottom:88px;width:min(' + Number(widgetWidth || 430) + 'px,calc(100vw - 32px));height:min(680px,calc(100vh - 112px));border:0;border-radius:' + Number(widgetRadius || 16) + 'px;box-shadow:0 18px 50px rgba(25,70,53,.22);z-index:2147483645;background:#f5f8f6';
  button.onclick = function () { frame.style.display = frame.style.display === 'none' ? 'block' : 'none'; };
  document.body.appendChild(frame);
  if (launcherStyle === 'inline' && current && current.parentNode) current.parentNode.insertBefore(button, current.nextSibling);
  else document.body.appendChild(button);
}());`;
  return new NextResponse(script, { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
