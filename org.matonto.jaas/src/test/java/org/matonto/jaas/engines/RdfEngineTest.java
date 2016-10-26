package org.matonto.jaas.engines;

/*-
 * #%L
 * org.matonto.jaas
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

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.matonto.jaas.api.ontologies.usermanagement.*;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.*;
import org.matonto.rdf.orm.impl.ThingFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import java.util.Optional;
import java.util.Set;

public class RdfEngineTest {
    private Repository repo;
    private RdfEngine engine;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private UserFactory userFactory = new UserFactory();
    private GroupFactory groupFactory = new GroupFactory();
    private RoleFactory roleFactory = new RoleFactory();

    private String userId = "http://matonto.org/users/tester";
    private String password = "test";
    private String groupId = "http://matonto.org/groups/testers";

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        groupFactory.setModelFactory(mf);
        groupFactory.setValueFactory(vf);
        groupFactory.setValueConverterRegistry(vcr);
        roleFactory.setModelFactory(mf);
        roleFactory.setValueFactory(vf);
        roleFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(userFactory);
        vcr.registerValueConverter(groupFactory);
        vcr.registerValueConverter(roleFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        engine = new RdfEngine();
        engine.setRepository(repo);
        engine.setValueFactory(vf);
        engine.setModelFactory(mf);
        engine.setUserFactory(userFactory);
        engine.setGroupFactory(groupFactory);
        engine.setRoleFactory(roleFactory);

        User testUser = userFactory.createNew(vf.createIRI(userId));
        testUser.setPassword(vf.createLiteral(password));
        Group testGroup = groupFactory.createNew(vf.createIRI(groupId));
        RepositoryConnection conn = repo.getConnection();
        conn.add(testUser.getModel(), vf.createIRI("http://matonto.org/usermanagement"));
        conn.add(testGroup.getModel(), vf.createIRI("http://matonto.org/usermanagement"));
        conn.close();

        engine.activate();
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    /*@Test
    public void testGetUsers() throws Exception {
        Set<User> users = engine.getUsers();
        
        Assert.assertTrue(!users.isEmpty());
    }*/

    @Test
    public void testRetrieveUser() throws Exception {
        Optional<User> userOptional = engine.retrieveUser(userId);

        Assert.assertTrue(userOptional.isPresent());
        User user = userOptional.get();
        Assert.assertTrue(user.getResource().stringValue().equals(userId));
        Assert.assertTrue(user.getPassword().isPresent());
        Assert.assertTrue(user.getPassword().get().stringValue().equals(password));
    }

    /*@Test
    public void testGetGroups() throws Exception {
        Set<Group> groups= engine.getGroups();

        Assert.assertTrue(!groups.isEmpty());
    }*/

    @Test
    public void testRetrieveGroup() throws Exception {
        Optional<Group> groupOptional = engine.retrieveGroup(groupId);

        Assert.assertTrue(groupOptional.isPresent());
        Group group = groupOptional.get();
        Assert.assertTrue(group.getResource().stringValue().equals(groupId));
    }
}
