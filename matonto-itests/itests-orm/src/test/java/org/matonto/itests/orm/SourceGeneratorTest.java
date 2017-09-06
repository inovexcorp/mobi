package org.matonto.itests.orm;

/*-
 * #%L
 * itests-orm
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.matonto.foaf.Agent;
import org.matonto.foaf.AgentFactory;
import org.matonto.foaf.OnlineAccountFactory;
import org.matonto.foaf.OnlineChatAccount;
import org.matonto.foaf.OnlineChatAccountFactory;
import org.matonto.inherit.Entity;
import org.matonto.inherit.EntityFactory;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactoryService;
import org.matonto.rdf.core.impl.sesame.ValueFactoryService;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.rdf.orm.impl.ThingFactory;
import org.matonto.test.Person;
import org.matonto.test.PersonFactory;
import org.openrdf.model.vocabulary.RDF;

import java.lang.reflect.Method;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

public class SourceGeneratorTest {

    private static ValueFactory valueFactory;

    private static ValueConverterRegistry valueConverterRegistry;

    private static ModelFactory modelFactory;

    private Model model;
    private Model personModel;

    private static IRI TEST_AGENT;
    private static IRI TEST_ACCOUNT;
    private static IRI TEST_PERSON;
    private static IRI RDF_TYPE;
    private static IRI AGENT_CLASS;
    private static IRI ONLINE_ACCOUNT_CLASS;
    private static IRI GENDER_PROP;
    private static IRI AGE_PROP;
    private static IRI MBOX_PROP;
    private static IRI ACCOUNT_NAME_PROP;
    private static IRI PERSON_CLASS;
    private static IRI NAME_PROP;
    private static IRI NICKNAME_PROP;
    private static IRI OWNS_PROP;
    private static IRI FAV_CAR_PROP;
    private static IRI TEST_CAR1;
    private static IRI TEST_CAR2;
    private static IRI TEST_CAR3;
    private static IRI CAR_CLASS;

    @BeforeClass
    public static void beforeTest() {
        valueFactory = new ValueFactoryService();
        modelFactory = new LinkedHashModelFactoryService();
        valueConverterRegistry = new DefaultValueConverterRegistry();
        valueConverterRegistry.registerValueConverter(new DoubleValueConverter());
        valueConverterRegistry.registerValueConverter(new IntegerValueConverter());
        valueConverterRegistry.registerValueConverter(new FloatValueConverter());
        valueConverterRegistry.registerValueConverter(new ShortValueConverter());
        valueConverterRegistry.registerValueConverter(new StringValueConverter());
        valueConverterRegistry.registerValueConverter(new ValueValueConverter());
        valueConverterRegistry.registerValueConverter(new LiteralValueConverter());
        valueConverterRegistry.registerValueConverter(new ThingFactory());
    }

    @Before
    public void before() {
        TEST_AGENT = valueFactory.createIRI("urn://matonto.org/orm/test/testAgent");
        TEST_ACCOUNT = valueFactory.createIRI("urn://matonto.org/orm/test/account");
        RDF_TYPE = valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
        AGENT_CLASS = valueFactory.createIRI("http://xmlns.com/foaf/0.1/Agent");
        ONLINE_ACCOUNT_CLASS = valueFactory.createIRI("http://xmlns.com/foaf/0.1/OnlineAccount");
        GENDER_PROP = valueFactory.createIRI("http://xmlns.com/foaf/0.1/gender");
        AGE_PROP = valueFactory.createIRI("http://xmlns.com/foaf/0.1/age");
        MBOX_PROP = valueFactory.createIRI("http://xmlns.com/foaf/0.1/mbox");
        ACCOUNT_NAME_PROP = valueFactory.createIRI("http://xmlns.com/foaf/0.1/accountName");

        model = modelFactory.createModel();
        model.add(TEST_AGENT, RDF_TYPE, AGENT_CLASS, TEST_AGENT);
        model.add(TEST_AGENT, GENDER_PROP, valueFactory.createLiteral("male"), TEST_AGENT);
        model.add(TEST_AGENT, AGE_PROP, valueFactory.createLiteral(100), TEST_AGENT);
        model.add(TEST_AGENT, MBOX_PROP, TEST_ACCOUNT, TEST_AGENT);

        model.add(TEST_ACCOUNT, RDF_TYPE, ONLINE_ACCOUNT_CLASS, TEST_ACCOUNT);
        model.add(TEST_ACCOUNT, ACCOUNT_NAME_PROP, valueFactory.createLiteral("tester@gmail.com"), TEST_ACCOUNT);

        TEST_PERSON = valueFactory.createIRI("urn://matonto.org/orm/test/person");
        PERSON_CLASS = valueFactory.createIRI("http://matonto.org/ontologies/person#Person");
        NAME_PROP = valueFactory.createIRI("http://matonto.org/ontologies/person#name");
        NICKNAME_PROP = valueFactory.createIRI("http://matonto.org/ontologies/person#nickname");
        OWNS_PROP = valueFactory.createIRI("http://matonto.org/ontologies/person#owns");
        FAV_CAR_PROP = valueFactory.createIRI("http://matonto.org/ontologies/person#favoriteCar");
        TEST_CAR1 = valueFactory.createIRI("urn://matonto.org/orm/test/car1");
        TEST_CAR2 = valueFactory.createIRI("urn://matonto.org/orm/test/car2");
        TEST_CAR3 = valueFactory.createIRI("urn://matonto.org/orm/test/car3");
        CAR_CLASS = valueFactory.createIRI("http://matonto.org/ontologies/person#Car");

        personModel = modelFactory.createModel();
        personModel.add(TEST_PERSON, RDF_TYPE, PERSON_CLASS);
        personModel.add(TEST_PERSON, NAME_PROP, valueFactory.createLiteral("Bob"));
        personModel.add(TEST_PERSON, NICKNAME_PROP, valueFactory.createLiteral("Bobby"));
        personModel.add(TEST_PERSON, NICKNAME_PROP, valueFactory.createLiteral("Robert"));
        personModel.add(TEST_PERSON, OWNS_PROP, TEST_CAR1);
        personModel.add(TEST_PERSON, OWNS_PROP, TEST_CAR2);
        personModel.add(TEST_PERSON, OWNS_PROP, TEST_CAR3);
        personModel.add(TEST_PERSON, FAV_CAR_PROP, TEST_CAR1);

        personModel.add(TEST_CAR2, RDF_TYPE, CAR_CLASS);
    }

    @Test
    public void testAgent() {
        final AgentFactory factory = new AgentFactory();
        valueConverterRegistry.registerValueConverter(factory);
        factory.setValueFactory(valueFactory);
        factory.setModelFactory(modelFactory);
        factory.setValueConverterRegistry(valueConverterRegistry);

        // agent
        final Agent a = factory.getExisting(TEST_AGENT, model, valueFactory, valueConverterRegistry)
                .orElseThrow(() -> new RuntimeException("WHAT? No agent returned"));
        assertEquals(valueFactory.createLiteral(100), a.getAge().orElse(null));
        assertEquals(valueFactory.createLiteral("male"), a.getGender().orElse(null));
        assertEquals(Optional.empty(), a.getBirthday());

        // account
        final OnlineAccountFactory f = new OnlineAccountFactory();
        f.setModelFactory(modelFactory);
        f.setValueConverterRegistry(valueConverterRegistry);
        f.setValueFactory(valueFactory);
        valueConverterRegistry.registerValueConverter(f);
        final OnlineChatAccountFactory acctFactory = new OnlineChatAccountFactory();
        valueConverterRegistry.registerValueConverter(acctFactory);
        acctFactory.setModelFactory(modelFactory);
        acctFactory.setValueConverterRegistry(valueConverterRegistry);
        acctFactory.setValueFactory(valueFactory);
        final OnlineChatAccount account = acctFactory.createNew(valueFactory.createIRI("urn://account"), model, valueFactory, valueConverterRegistry);
        a.setAccount(Collections.singleton(account));
        assertNotNull(a.getAccount());
        assertFalse(a.getAccount().isEmpty());
        a.setAccount(new HashSet<>());
        assertTrue(a.getAccount().isEmpty());
        a.addAccount(account);
        assertEquals("Account not equal to expected added value", account.getResource(), a.getAccount().iterator().next().getResource());
        a.removeAccount(account);
        assertTrue(a.getAccount().isEmpty());

        // mbox
        final Set<Thing> mboxes = a.getMbox();
        assertNotNull(mboxes);
        assertFalse(mboxes.isEmpty());
        final Thing mbox = mboxes.iterator().next();
        Value mboxValue = mbox.getProperty(ACCOUNT_NAME_PROP,
                TEST_ACCOUNT).orElse(null);
        assertEquals(valueFactory.createLiteral("tester@gmail.com"), mboxValue);
        assertEquals(TEST_ACCOUNT, mbox.getResource());
    }

    @Test
    public void testMultiType() {
        final OnlineChatAccountFactory factory = new OnlineChatAccountFactory();
        valueConverterRegistry.registerValueConverter(factory);
        factory.setValueFactory(valueFactory);
        factory.setModelFactory(modelFactory);
        factory.setValueConverterRegistry(valueConverterRegistry);
        OnlineChatAccount account = factory.createNew(valueFactory.createIRI("urn://matonto.org/orm/test/testOCA"), model, valueFactory, valueConverterRegistry);
        Model m = account.getModel().filter(account.getResource(), null, null);
        assertFalse(m.isEmpty());
        m.forEach(stmt -> {
            assertEquals(account.getResource(), stmt.getSubject());
            assertEquals(RDF.TYPE, stmt.getPredicate());
        });
    }

    @Test
    public void testRangeFromImport() throws Exception {
        Method m = org.matonto.inherit.Entity.class.getDeclaredMethod("getFriend");
        assertEquals(Optional.class, m.getReturnType());
        EntityFactory f = new EntityFactory();
        f.setModelFactory(modelFactory);
        f.setValueConverterRegistry(valueConverterRegistry);
        f.setValueFactory(valueFactory);
        AgentFactory agentFactory = new AgentFactory();
        agentFactory.setModelFactory(modelFactory);
        agentFactory.setValueConverterRegistry(valueConverterRegistry);
        agentFactory.setValueFactory(valueFactory);

        Entity entity = f.createNew(valueFactory.createIRI("urn://entityTest"), model);
        entity.setFriend(agentFactory.createNew(valueFactory.createIRI("urn://agentTest"), model));
        Optional<Agent> agentOptional = entity.getFriend();
        assertTrue(agentOptional.isPresent());
    }

    @Test
    public void testRetrievingValues() throws Exception {
        final PersonFactory factory = new PersonFactory();
        valueConverterRegistry.registerValueConverter(factory);
        factory.setValueFactory(valueFactory);
        factory.setModelFactory(modelFactory);
        factory.setValueConverterRegistry(valueConverterRegistry);

        final Person person = factory.getExisting(TEST_PERSON, personModel, valueFactory, valueConverterRegistry)
                .orElseThrow(() -> new RuntimeException("WHAT? No person returned"));
        assertEquals("Bob", person.getName().get());
        assertEquals(2, person.getNickname().size());
        assertEquals(3, person.getOwns_resource().size());
        assertEquals(1, person.getOwns().size());
        assertTrue(person.getFavoriteCar_resource().isPresent());
        assertTrue(!person.getFavoriteCar().isPresent());
    }
}