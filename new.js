const wrapper=document.querySelector('.wrapper');
const loginLink=document.querySelector('.loginlnk');
const registerLink=document.querySelector('.registerlnk');
const btnpop=document.querySelector('.btnLogin-popup');
const iconClose=document.querySelector('.close');

registerLink.addEventListener('click',()=>{
    wrapper.classList.add('active');
});

loginLink.addEventListener('click',()=>{
    wrapper.classList.remove('active');
});

btnpop.addEventListener('click',()=>{
    wrapper.classList.add('active-popup');
});
iconClose.addEventListener('click',()=>{
    wrapper.classList.remove('active-popup');
});

