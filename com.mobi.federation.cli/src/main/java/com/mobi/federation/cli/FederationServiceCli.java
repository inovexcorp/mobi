package com.mobi.federation.cli;

/*-
 * #%L
 * com.mobi.federation.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import static org.apache.commons.lang3.StringUtils.isBlank;

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import com.mobi.federation.api.FederationService;

import java.util.List;
import java.util.Optional;

/**
 * Command line utilities for interacting with the Federated Services.
 *
 * @author Sean Smitz &lt;sean.smitz@inovexcorp.com&gt;
 */
@Command(scope = "mobi", name = "fedsvc", description = "View information about or restart Federation Services.")
@Service
public class FederationServiceCli implements Action {
    private static final String VIEW_OPERATION = "view";
    private static final String RESTART_OPERATION = "restart";
    private static final String START_OPERATION = "start";
    private static final String STOP_OPERATION = "stop";

    private static final String fedInfoFormatString = "%s\nid: %s\ndescription: %s\n\n";
    private static final String fedNodeFormatString = "\t%s\n"; // TODO: Get more node information

    @Reference
    private List<FederationService> federationServices;

    @Argument(name = "operation", description = "Controls the interaction performed with the Federation Services.\n"
            + "mobi:fedsvc view - To view configuration information about connected federations.\n"
            + "mobi:fedsvc -f/--federation <id> view - To view nodes in a federation.\n"
            + "mobi:fedsvc  -f/--federation <id> restart - To restart the connection to the specified federation.\n",
            required = true)
    private String operation = null;

    @Option(name = "-f", aliases = "--federation", description = "Specify the federation id to run the specified"
            + " operation against.")
    private String federation = null;

    void setFederationServices(List<FederationService> federationServices) {
        this.federationServices = federationServices;
    }

    @Override
    public Object execute() throws Exception {
        switch (operation) {
            case VIEW_OPERATION:
                if (isBlank(federation)) {
                    viewFederations();
                } else {
                    viewFederationNodes(federation);
                }
                break;
            case RESTART_OPERATION:
                restartFederation(federation);
                break;
            case START_OPERATION:
                startFederation(federation);
                break;
            case STOP_OPERATION:
                stopFederation(federation);
                break;
            default:
                throw new IllegalArgumentException("Unknown operation: " + operation);
        }
        return null;
    }

    private void viewFederations() {
        StringBuilder sb = new StringBuilder();
        federationServices.stream().map(FederationService::getFederationServiceConfig).forEach(config ->
                sb.append(String.format(fedInfoFormatString, config.title(), config.id(), config.description())));
        System.out.print(sb.toString());
    }

    private void viewFederationNodes(final String federation) {
        Optional<FederationService> fedService = federationServices.stream()
                .filter(service -> service.getFederationServiceConfig().id().equals(federation))
                .findFirst();
        if (fedService.isPresent()) {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Federation (%s) Connected Nodes\n", federation));
            fedService.get().getFederationNodeIds().forEach(id -> sb.append(String.format(fedNodeFormatString, id)));
            System.out.print(sb.toString());
        }
    }

    private void restartFederation(final String federation) {
        if (isBlank(federation)) {
            throw new IllegalArgumentException("Federation identifier is required for restart.");
        }
        federationServices.stream().filter(service -> service.getFederationServiceConfig().id().equals(federation))
                .forEach(FederationService::restart);
    }

    private void startFederation(final String federation) {
        if (isBlank(federation)) {
            throw new IllegalArgumentException("Federation identifier is required for restart.");
        }
        federationServices.stream().filter(service -> service.getFederationServiceConfig().id().equals(federation))
                .forEach(FederationService::start);
    }

    private void stopFederation(final String federation) {
        if (isBlank(federation)) {
            throw new IllegalArgumentException("Federation identifier is required for restart.");
        }
        federationServices.stream().filter(service -> service.getFederationServiceConfig().id().equals(federation))
                .forEach(FederationService::stop);
    }
}
