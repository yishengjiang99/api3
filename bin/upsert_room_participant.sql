insert into room_participants (roomname,participant_id,tracks,active_at)
  values ('room1','yisheng2','["3822bcb9-a654-401a-9b68-a73618d4414c","5249ed4b-4f50-4bc7-9a7d-1037218bf5d2"]','now()') 
  on duplicate key update
  tracks='["3822bcb9-a654-401a-9b68-a73618d4414c","5249ed4b-4f50-4bc7-9a7d-1037218bf5d2"]',
  last_active='now()'; 

  CREATE TABLE `room_participants` (
  `roomname` varchar(355) DEFAULT NULL,
  `participant_id` varchar(255) DEFAULT NULL,
  `tracks` text,
  `last_active` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `ucc` (`roomname`,`participant_id`)