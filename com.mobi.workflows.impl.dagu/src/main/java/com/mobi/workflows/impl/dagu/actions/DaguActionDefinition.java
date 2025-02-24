package com.mobi.workflows.impl.dagu.actions;

/*-
 * #%L
 * com.mobi.workflows.impl.dagu
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import com.fasterxml.jackson.dataformat.yaml.YAMLGenerator;
import com.mobi.exception.MobiException;
import com.mobi.workflows.api.action.ActionDefinition;
import com.mobi.workflows.api.ontologies.workflows.Action;

import java.io.IOException;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;

public class DaguActionDefinition implements ActionDefinition {
    private static ObjectMapper mapper = new ObjectMapper(new YAMLFactory()
            .disable(YAMLGenerator.Feature.WRITE_DOC_START_MARKER)
            .disable(YAMLGenerator.Feature.SPLIT_LINES)
            .enable(YAMLGenerator.Feature.INDENT_ARRAYS)
            .enable(YAMLGenerator.Feature.INDENT_ARRAYS_WITH_INDICATOR)
            .enable(YAMLGenerator.Feature.MINIMIZE_QUOTES));
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
        return "curl -k -s " + additionalFlags + " -b \"mobi_web_token=$2\" $1/mobirest" + cleanedHttpPath;
    }

    private String yaml;
    private final Action action;
    private final List<String> stepNames = new ArrayList<>();

    DaguActionDefinition(String yaml, Action action) {
        setYaml(yaml);
        this.action = action;
    }

    public void setYaml(String yaml) {
        this.yaml = yaml;
        JsonNode stepNode = validate().get("steps");
        for (JsonNode step : stepNode) {
            this.stepNames.add(step.get("name").textValue());
        }
    }

    public String toString() {
        return yaml;
    }

    public List<String> getStepNames() {
        return stepNames;
    }

    @Override
    public void addDependency(ActionDefinition parentAction) {
        if (!(parentAction instanceof DaguActionDefinition)) {
            throw new MobiException("Cannot add non-DaguActionDefinition as a child of a DaguActionDefinition");
        }

        List<String> stepNames = ((DaguActionDefinition) parentAction).getStepNames();
        String lastStepName = stepNames.get(stepNames.size() - 1);
        JsonNode yaml = validate();
        JsonNode step1 = yaml.get("steps").get(0);
        if (step1.isObject()) {
            if (step1.has("depends")) {
                JsonNode dependsArr = step1.get("depends");
                if (dependsArr.isArray()) {
                    ((ArrayNode) dependsArr).add(lastStepName);
                    ((ObjectNode) step1).set("depends", dependsArr);
                }
            } else {
                ArrayNode dependsArr = mapper.createArrayNode();
                dependsArr.add(lastStepName);
                ((ObjectNode) step1).set("depends", dependsArr);
            }
        }
        StringWriter writer = new StringWriter();
        try {
            mapper.writeValue(writer, yaml);
        } catch (IOException e) {
            throw new MobiException("Error when writing updated yaml", e);
        }
        this.yaml = writer.toString().replace("steps:\n", "").trim().replaceAll("\n {2}", "\n");
    }

    @Override
    public Action getAction() {
        return action;
    }

    private JsonNode validate() {
        try {
            return mapper.readTree("steps:\n" + this.yaml);
        } catch (JsonProcessingException e) {
            throw new MobiException("Error parsing Action YAML", e);
        }
    }
}
