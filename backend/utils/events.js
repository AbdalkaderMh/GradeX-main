import EventEmitter from "events";
export const notificationEvents = new EventEmitter();

export const emitNotification = (recipientId, notification) => {
    notificationEvents.emit(`new-notification-${recipientId}`, notification);
};
