/* Agenda app using XML stored in localStorage. Uses jQuery. */
$(function(){
  const STORAGE_KEY = 'agenda_xml_v1';
  const defaultXML = `<?xml version="1.0" encoding="utf-8"?>\n<agenda>\n  <contact id="1">\n    <name>John Doe</name>\n    <address>123 Main St</address>\n    <email>john@example.com</email>\n    <phone>+1 555 1234</phone>\n    <picture></picture>\n    <birthdate>1980-05-12</birthdate>\n    <sex>M</sex>\n  </contact>\n</agenda>`;

  let xmlDoc = null;

  // Utilities
  function parseXML(str){
    return new DOMParser().parseFromString(str, 'application/xml');
  }
  function serializeXML(doc){
    return new XMLSerializer().serializeToString(doc);
  }

  function loadFromStorage(){
    const s = localStorage.getItem(STORAGE_KEY);
    if(s){
      xmlDoc = parseXML(s);
      if(xmlDoc.getElementsByTagName('parsererror').length) {
        console.warn('Saved XML parse error, loading default');
        xmlDoc = parseXML(defaultXML);
      }
    } else {
      xmlDoc = parseXML(defaultXML);
      saveToStorage();
    }
  }

  function saveToStorage(){
    const xml = serializeXML(xmlDoc);
    localStorage.setItem(STORAGE_KEY, xml);
  }

  // Render list
  function renderList(filter){
    const $list = $('#list');
    $list.empty();
    const contacts = xmlDoc.getElementsByTagName('contact');
    const results = [];
    for(let i=0;i<contacts.length;i++){
      const c = contacts[i];
      const name = (c.getElementsByTagName('name')[0]?.textContent||'');
      const phone = (c.getElementsByTagName('phone')[0]?.textContent||'');
      const email = (c.getElementsByTagName('email')[0]?.textContent||'');
      const q = (filter||'').toLowerCase();
      if(q && !(name+phone+email).toLowerCase().includes(q)) continue;
      results.push(c);
    }
    if(results.length===0){
      $('#empty').show();
    } else {
      $('#empty').hide();
    }
    results.forEach(c=>{
      const id = c.getAttribute('id')||'';
      const name = c.getElementsByTagName('name')[0]?.textContent||'';
      const phone = c.getElementsByTagName('phone')[0]?.textContent||'';
      const email = c.getElementsByTagName('email')[0]?.textContent||'';
      const picture = c.getElementsByTagName('picture')[0]?.textContent||'';
      const $li = $(
        `<li class="contact-item" data-id="${id}">`+
        `<img src="${picture||'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\"><rect width=\"100%\" height=\"100%\" fill=\"%23ddd\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%23777\" font-size=\"12\">No Img</text></svg>'}" alt="">`+
        `<div class="contact-info"><div class="contact-name">${escapeHtml(name)}</div><div class="contact-meta">${escapeHtml(phone)} ${email?'<br/>'+escapeHtml(email):''}</div></div>`+
        `</li>`);
      $li.on('click',()=>{ openForm('edit', id); });
      $list.append($li);
    });
  }

  function escapeHtml(s){ return (s||'').replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // Form handling
  function openForm(mode, id){
    $('#formTitle').text(mode==='add'?'Add Contact':'Edit Contact');
    $('#contactForm')[0].reset();
    $('#contactId').val('');
    $('#picturePreview').attr('src','');
    $('#delete').toggle(mode==='edit');
    if(mode==='edit'){
      const c = findContactById(id);
      if(!c) return;
      $('#contactId').val(id);
      $('#name').val(textFromNode(c,'name'));
      $('#address').val(textFromNode(c,'address'));
      $('#email').val(textFromNode(c,'email'));
      $('#phone').val(textFromNode(c,'phone'));
      $('#birthdate').val(textFromNode(c,'birthdate'));
      $('#sex').val(textFromNode(c,'sex'));
      const pic = textFromNode(c,'picture')||'';
      if(pic) $('#picturePreview').attr('src', pic);
    }
    $('#modal').removeClass('hidden');
  }
  function closeForm(){ $('#modal').addClass('hidden'); }

  function textFromNode(node, tag){ return node.getElementsByTagName(tag)[0]?.textContent||''; }
  function findContactById(id){
    const contacts = xmlDoc.getElementsByTagName('contact');
    for(let i=0;i<contacts.length;i++) if(contacts[i].getAttribute('id')===id) return contacts[i];
    return null;
  }

  function addOrUpdateContactFromForm(){
    const id = $('#contactId').val() || String(Date.now());
    let c = findContactById(id);
    const isNew = !c;
    if(isNew){
      c = xmlDoc.createElement('contact');
      c.setAttribute('id', id);
      xmlDoc.documentElement.appendChild(c);
    }
    setTextNode(c,'name',$('#name').val());
    setTextNode(c,'address',$('#address').val());
    setTextNode(c,'email',$('#email').val());
    setTextNode(c,'phone',$('#phone').val());
    setTextNode(c,'birthdate',$('#birthdate').val());
    setTextNode(c,'sex',$('#sex').val());
    const pic = $('#picturePreview').attr('src')||'';
    setTextNode(c,'picture', pic);
    saveToStorage();
    renderList($('#search').val());
  }
  function setTextNode(parent, tag, text){
    let node = parent.getElementsByTagName(tag)[0];
    if(!node){ node = xmlDoc.createElement(tag); parent.appendChild(node); }
    node.textContent = text||'';
  }

  function deleteContactById(id){
    const c = findContactById(id);
    if(!c) return;
    c.parentNode.removeChild(c);
    saveToStorage();
    renderList($('#search').val());
  }

  // Import / Export
  function exportXML(){
    const xmlStr = serializeXML(xmlDoc);
    const blob = new Blob([xmlStr], {type:'application/xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'contacts.xml';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function importXMLText(text){
    const doc = parseXML(text);
    if(doc.getElementsByTagName('parsererror').length){ alert('Invalid XML file.'); return; }
    const root = doc.documentElement;
    if(root.nodeName!=='agenda'){ if(!confirm('Root element is not <agenda>. Still import?')) return; }
    xmlDoc = doc;
    saveToStorage();
    renderList();
  }

  // Image handling
  $('#pictureFile').on('change', function(){
    const f = this.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = function(e){ $('#picturePreview').attr('src', e.target.result); }
    reader.readAsDataURL(f);
  });
  $('#clearPicture').on('click', function(){ $('#picturePreview').attr('src',''); $('#pictureFile').val(''); });

  // Buttons
  $('#btnAdd').on('click', ()=> openForm('add'));
  $('#cancel').on('click', ()=> closeForm());
  $('#contactForm').on('submit', function(ev){ ev.preventDefault(); addOrUpdateContactFromForm(); closeForm(); });
  $('#delete').on('click', function(){ const id = $('#contactId').val(); if(id && confirm('Delete this contact?')){ deleteContactById(id); closeForm(); }});

  $('#btnExport').on('click', exportXML);
  $('#btnImport').on('click', ()=> $('#fileImport').click());
  $('#fileImport').on('change', function(){ const f = this.files[0]; if(!f) return; const r=new FileReader(); r.onload=function(e){ importXMLText(e.target.result); }; r.readAsText(f); this.value=''; });

  $('#search').on('input', function(){ renderList($(this).val()); });

  // Init
  loadFromStorage();
  renderList();

  // Expose open for list click
  function openFormById(id){ openForm('edit', id); }

});
