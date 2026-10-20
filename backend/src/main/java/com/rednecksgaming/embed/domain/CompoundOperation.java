package com.rednecksgaming.embed.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompoundOperation {
    public enum OperationType {
        CREATE_TICKET,
        SEND_DM_TEMPLATE,
        SEND_CHANNEL_MESSAGE
    }

    private OperationType operationType;
    private String channelPrefix;
    private List<String> membersToAdd;
    private String templateId;
}
