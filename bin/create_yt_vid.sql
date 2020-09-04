create table ytvid(id varchar(32) not null default '', title varchar(255) not null default '', description text);
 create table vidid_display ( vid varchar(32), display_order tinyint(10));

 select y.* from  ytvid y left outer join vidid_display p on y.id=p.vid order by p.display_order desc limit 10;