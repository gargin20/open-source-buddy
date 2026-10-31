export function formatAge(createdAt) {
  const created = new 
  Date(createdAt).getTime();
  const difference = Date.now() - created;
  const days = Math.floor(
    difference/(1000*60*60*24)
  );
  if (days <= 0) {return 'today';
  }
  if(days === 1){return '1 day ago';                              
}
return '${days.toLocalestring()}days ago';
}
