package com.mobi.workflows.impl.dagu.actions;

/*-
 * #%L
 * com.mobi.workflows.impl.dagu
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.mobi.exception.MobiException;
import com.mobi.workflows.api.action.ActionDefinition;

import java.util.ArrayList;
import java.util.List;

public class DaguActionDefinition implements ActionDefinition {
    private static ObjectMapper mapper = new ObjectMapper(new YAMLFactory());

    private String yaml;
    private List<String> stepNames = new ArrayList<>();

    DaguActionDefinition(String yaml) {
        setYaml(yaml);
    }

    public void setYaml(String yaml) {
        this.yaml = yaml;
        JsonNode stepNode = validate().get("steps");
        for (JsonNode step: stepNode) {
            this.stepNames.add(String.valueOf(step.get("name")));
        }
    }

    public String toString() {
        return yaml;
    }

    public List<String> getStepNames() {
        return stepNames;
    }

    private JsonNode validate() {
        try {
            return mapper.readTree("steps:\n" + this.yaml);
        } catch (JsonProcessingException e) {
            throw new MobiException("Error parsing Action YAML", e);
        }
    }

    static String getStepsToCheckEmptyVariable(String variableName, String parentStep) {
        return "  - name: check " + variableName + "\n"
                + "    depends:\n"
                + "      - " + parentStep + "\n"
                + "    command: sh\n"
                + "    script: |\n"
                + "      [[ ! -z \"$" + variableName + "\" ]] && echo \"Not empty\" || echo \"Empty\"\n"
                + "    output: VALID_" + variableName + "\n"
                + "  - name: invalid " + variableName + "\n"
                + "    depends:\n"
                + "      - check " + variableName + "\n"
                + "    preconditions:\n"
                + "      - condition: \"$VALID_" + variableName + "\"\n"
                + "        expected: \"Empty\"\n"
                + "    command: \"echo '" + variableName + " invalid. Failing DAG'\"\n"
                + "    signalOnStop: \"SIGQUIT\"";
    }

    static String getPlatformCurlString(String additionalFlags, String httpPath) {
        String cleanedHttpPath = httpPath.startsWith("/") ? httpPath : "/" + httpPath;
        return "curl -k -s " + additionalFlags + " -b \\\"mobi_web_token=$2\\\" $1/mobirest/" + cleanedHttpPath;
    }
}
